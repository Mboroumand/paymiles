import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function refreshTeslaToken(userId: string, refreshToken: string) {
  const res = await fetch('https://auth.tesla.com/oauth2/v3/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.TESLA_CLIENT_ID!,
      client_secret: process.env.TESLA_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) return null
  const tokens = await res.json()
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
  await adminClient.from('profiles').update({
    tesla_access_token: tokens.access_token,
    tesla_refresh_token: tokens.refresh_token,
    tesla_token_expires_at: expiresAt,
  }).eq('id', userId)
  return tokens.access_token as string
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const carId = req.nextUrl.searchParams.get('carId')
  if (!carId) return NextResponse.json({ error: 'carId required' }, { status: 400 })

  // Get car + host profile (tokens)
  const { data: car } = await adminClient.from('cars').select('tesla_vehicle_id, host_id').eq('id', carId).single()
  if (!car?.tesla_vehicle_id) return NextResponse.json({ error: 'No Tesla vehicle linked to this car' }, { status: 404 })

  const { data: profile } = await adminClient.from('profiles')
    .select('tesla_access_token, tesla_refresh_token, tesla_token_expires_at')
    .eq('id', car.host_id).single()

  if (!profile?.tesla_access_token) return NextResponse.json({ error: 'Host has not connected Tesla' }, { status: 404 })

  let accessToken = profile.tesla_access_token

  // Refresh token if expired
  if (profile.tesla_token_expires_at && new Date(profile.tesla_token_expires_at) < new Date()) {
    const newToken = await refreshTeslaToken(car.host_id, profile.tesla_refresh_token)
    if (!newToken) return NextResponse.json({ error: 'Tesla token refresh failed' }, { status: 401 })
    accessToken = newToken
  }

  // Wake vehicle if needed, then read odometer
  const vehicleId = car.tesla_vehicle_id
  const dataRes = await fetch(
    `https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles/${vehicleId}/vehicle_data?endpoints=vehicle_state`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!dataRes.ok) {
    // Vehicle may be asleep — try to wake it
    await fetch(`https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles/${vehicleId}/wake_up`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return NextResponse.json({ error: 'Vehicle asleep — please try again in 30 seconds', asleep: true }, { status: 503 })
  }

  const data = await dataRes.json()
  const odometer = data?.response?.vehicle_state?.odometer

  if (odometer == null) return NextResponse.json({ error: 'Could not read odometer' }, { status: 500 })

  return NextResponse.json({ odometer, unit: 'miles', vehicleId })
}
