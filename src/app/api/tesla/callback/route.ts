import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')
  const state = req.nextUrl.searchParams.get('state') ?? ''
  const [userId, carId] = state.split(':')

  if (error) {
    console.error('Tesla OAuth error:', error, req.nextUrl.searchParams.get('error_description'))
    return NextResponse.redirect(new URL(`/host/fleet?tesla_error=${encodeURIComponent(error)}`, req.url))
  }

  if (!code || !userId) {
    return NextResponse.redirect(new URL('/host/fleet?tesla_error=missing_code', req.url))
  }

  const appUrl = 'https://paymiles.vercel.app'

  // Exchange code for tokens
  const tokenRes = await fetch('https://auth.tesla.com/oauth2/v3/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.TESLA_CLIENT_ID!,
      client_secret: process.env.TESLA_CLIENT_SECRET!,
      code,
      redirect_uri: `${appUrl}/api/tesla/callback`,
      audience: 'https://fleet-api.prd.na.vn.cloud.tesla.com',
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    console.error('Tesla token exchange failed:', err)
    return NextResponse.redirect(new URL(`/host/fleet?tesla_error=${encodeURIComponent('token_exchange_failed')}`, req.url))
  }

  const tokens = await tokenRes.json()
  const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString()

  // Save tokens to profile
  const { error: profileErr } = await adminClient.from('profiles').update({
    tesla_access_token: tokens.access_token,
    tesla_refresh_token: tokens.refresh_token,
    tesla_token_expires_at: expiresAt,
  }).eq('id', userId)

  if (profileErr) {
    console.error('Failed to save Tesla tokens:', profileErr.message)
    return NextResponse.redirect(new URL(`/host/fleet?tesla_error=${encodeURIComponent('db_save_failed: ' + profileErr.message)}`, req.url))
  }

  if (!carId) {
    return NextResponse.redirect(new URL('/host/fleet?tesla=connected', req.url))
  }

  // Fetch vehicles list
  const vehiclesRes = await fetch('https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  if (!vehiclesRes.ok) {
    const err = await vehiclesRes.text()
    console.error('Tesla vehicles fetch failed:', err)
    // Tokens saved but couldn't fetch vehicles — still a partial success
    return NextResponse.redirect(new URL(`/host/fleet/${carId}?tab=details&tesla_error=vehicles_fetch_failed`, req.url))
  }

  const vehiclesData = await vehiclesRes.json()
  const vehicles = vehiclesData.response ?? vehiclesData.vehicles ?? []

  console.log('Tesla vehicles:', JSON.stringify(vehicles.map((v: any) => ({ id: v.id, id_s: v.id_s, name: v.display_name }))))

  if (vehicles.length === 0) {
    return NextResponse.redirect(new URL(`/host/fleet/${carId}?tab=details&tesla_error=no_vehicles`, req.url))
  }

  if (vehicles.length === 1) {
    // Use id_s (string) which is the stable vehicle ID for Fleet API
    const vehicleId = vehicles[0].id_s ?? String(vehicles[0].id)
    const { error: carErr } = await adminClient.from('cars').update({ tesla_vehicle_id: vehicleId }).eq('id', carId)
    if (carErr) console.error('Failed to save vehicle ID:', carErr.message)
    return NextResponse.redirect(new URL(`/host/fleet/${carId}?tab=details&tesla=connected`, req.url))
  }

  // Multiple vehicles — let host choose
  const list = encodeURIComponent(JSON.stringify(
    vehicles.map((v: any) => ({ id: v.id_s ?? String(v.id), name: v.display_name, vin: v.vin }))
  ))
  return NextResponse.redirect(new URL(`/host/fleet/${carId}/select-tesla?vehicles=${list}`, req.url))
}
