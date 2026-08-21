import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

// Runs daily at 6am UTC via Vercel Cron
// Checks FSD status for all cars with a Tesla vehicle linked

const FSD_CAPABLE = ['TeslaAP3', 'TeslaAP4', 'FULL_SELF_DRIVING', 'FSD']

async function getValidToken(hostId: string): Promise<string | null> {
  const { data: profile } = await adminClient.from('profiles')
    .select('tesla_access_token, tesla_refresh_token, tesla_token_expires_at')
    .eq('id', hostId).single()

  if (!profile?.tesla_access_token) return null

  if (profile.tesla_token_expires_at && new Date(profile.tesla_token_expires_at) < new Date()) {
    const res = await fetch('https://auth.tesla.com/oauth2/v3/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.TESLA_CLIENT_ID!,
        client_secret: process.env.TESLA_CLIENT_SECRET!,
        refresh_token: profile.tesla_refresh_token,
      }),
    })
    if (!res.ok) return null
    const tokens = await res.json()
    await adminClient.from('profiles').update({
      tesla_access_token: tokens.access_token,
      tesla_refresh_token: tokens.refresh_token,
      tesla_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    }).eq('id', hostId)
    return tokens.access_token
  }

  return profile.tesla_access_token
}

export async function GET(req: NextRequest) {
  // Verify this is a legitimate Vercel Cron call
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: cars } = await adminClient
    .from('cars')
    .select('id, tesla_vehicle_id, host_id, has_fsd')
    .not('tesla_vehicle_id', 'is', null)

  if (!cars || cars.length === 0) {
    return NextResponse.json({ message: 'No linked cars', checked: 0 })
  }

  const results: { car_id: string; has_fsd: boolean; driver_assist: string; changed: boolean }[] = []

  for (const car of cars) {
    try {
      const token = await getValidToken(car.host_id)
      if (!token) continue

      const res = await fetch(
        `https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles/${car.tesla_vehicle_id}/vehicle_data?endpoints=vehicle_config`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) continue // asleep or unavailable — skip

      const data = await res.json()
      const config = data?.response?.vehicle_config ?? {}
      const driverAssist: string = config.driver_assist ?? ''
      const autopilotVersion: string = config.autopilot_version ?? ''

      const hasFsd =
        FSD_CAPABLE.some(v => driverAssist.toUpperCase().includes(v.toUpperCase())) ||
        FSD_CAPABLE.some(v => autopilotVersion.toUpperCase().includes(v.toUpperCase())) ||
        config.full_self_driving === true

      const changed = hasFsd !== car.has_fsd
      if (changed) {
        await adminClient.from('cars').update({ has_fsd: hasFsd }).eq('id', car.id)
      }

      results.push({ car_id: car.id, has_fsd: hasFsd, driver_assist: driverAssist, changed })
    } catch {
      // skip this car on error
    }
  }

  console.log('[FSD-SYNC] daily sync complete:', results)
  return NextResponse.json({ checked: results.length, results })
}
