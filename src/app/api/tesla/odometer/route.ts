import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/tesla/odometer?carId=<uuid>
 * Fetches live odometer from Tesla Fleet API using stored tokens.
 * Requires admin role.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const carId = req.nextUrl.searchParams.get('carId')
  if (!carId) return NextResponse.json({ error: 'Missing carId' }, { status: 400 })

  // Get car and Tesla vehicle ID
  const { data: car } = await supabase.from('cars').select('tesla_vehicle_id').eq('id', carId).single()
  if (!car?.tesla_vehicle_id) return NextResponse.json({ error: 'No Tesla vehicle linked to this car' }, { status: 404 })

  // Get stored Tesla tokens
  const { data: tokenRow } = await supabase.from('tesla_tokens').select('*').eq('car_id', carId).single()
  if (!tokenRow?.access_token) return NextResponse.json({ error: 'No Tesla token found. Authenticate via Tesla OAuth first.' }, { status: 404 })

  // Check token expiry and refresh if needed
  let accessToken = tokenRow.access_token
  if (new Date(tokenRow.expires_at) <= new Date()) {
    const refreshed = await refreshTeslaToken(tokenRow.refresh_token)
    if (!refreshed) return NextResponse.json({ error: 'Failed to refresh Tesla token' }, { status: 500 })

    await supabase.from('tesla_tokens').update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('car_id', carId)
    accessToken = refreshed.access_token
  }

  // Call Tesla Fleet API
  try {
    const res = await fetch(
      `https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles/${car.tesla_vehicle_id}/vehicle_data?endpoints=vehicle_state`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: err.error ?? 'Tesla API error', status: res.status }, { status: 502 })
    }
    const data = await res.json()
    const odometer = data?.response?.vehicle_state?.odometer // in miles
    return NextResponse.json({ odometer, vehicleId: car.tesla_vehicle_id })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to reach Tesla API' }, { status: 502 })
  }
}

async function refreshTeslaToken(refreshToken: string) {
  try {
    const res = await fetch('https://auth.tesla.com/oauth2/v3/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: process.env.TESLA_CLIENT_ID,
        refresh_token: refreshToken,
      }),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
