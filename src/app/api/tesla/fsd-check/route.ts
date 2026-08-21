import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function getValidToken(hostId: string) {
  const { data: profile } = await adminClient.from('profiles')
    .select('tesla_access_token, tesla_refresh_token, tesla_token_expires_at')
    .eq('id', hostId).single()

  if (!profile?.tesla_access_token) return null
  let token = profile.tesla_access_token

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
    token = tokens.access_token
  }

  return token
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { carId } = await req.json()
  if (!carId) return NextResponse.json({ error: 'carId required' }, { status: 400 })

  const { data: car } = await adminClient.from('cars')
    .select('tesla_vehicle_id, host_id')
    .eq('id', carId).single()

  if (!car?.tesla_vehicle_id) {
    return NextResponse.json({ error: 'No Tesla vehicle linked to this car' }, { status: 404 })
  }

  const token = await getValidToken(car.host_id)
  if (!token) return NextResponse.json({ error: 'Host Tesla not connected' }, { status: 404 })

  const res = await fetch(
    `https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles/${car.tesla_vehicle_id}/vehicle_data?endpoints=vehicle_config`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) {
    // Try wake
    await fetch(`https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles/${car.tesla_vehicle_id}/wake_up`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    })
    return NextResponse.json({ error: 'Vehicle asleep — try again in 30 seconds', asleep: true }, { status: 503 })
  }

  const data = await res.json()
  const config = data?.response?.vehicle_config

  // FSD is active when autopilot_version contains "FSD" or driver_assist is "FSD"
  // Tesla API returns: autopilot_version like "FSDc", "FSD_ACTIVE", "AUTOPILOT_HW3"
  // driver_assist: "AUTOPILOT_FULL_SELF_DRIVING" or "AUTOPILOT_NON_CHINA"
  const autopilotVersion = config?.autopilot_version ?? ''
  const driverAssist = config?.driver_assist ?? ''
  const hasFsd =
    autopilotVersion.toUpperCase().includes('FSD') ||
    driverAssist.toUpperCase().includes('FULL_SELF_DRIVING') ||
    driverAssist.toUpperCase().includes('FSD')

  // Auto-update the car record
  await adminClient.from('cars').update({ has_fsd: hasFsd }).eq('id', carId)

  return NextResponse.json({
    has_fsd: hasFsd,
    autopilot_version: autopilotVersion,
    driver_assist: driverAssist,
  })
}
