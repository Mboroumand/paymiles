import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state') ?? ''
  const [userId, carId] = state.split(':')

  if (!code || !userId) {
    return NextResponse.redirect(new URL('/host/fleet?error=tesla_auth_failed', req.url))
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://paymiles.vercel.app'

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
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    console.error('Tesla token exchange failed:', err)
    return NextResponse.redirect(new URL('/host/fleet?error=tesla_token_failed', req.url))
  }

  const tokens = await tokenRes.json()
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  // Save tokens to profile
  await adminClient.from('profiles').update({
    tesla_access_token: tokens.access_token,
    tesla_refresh_token: tokens.refresh_token,
    tesla_token_expires_at: expiresAt,
  }).eq('id', userId)

  // Fetch vehicles and link to car if carId provided
  if (carId) {
    const vehiclesRes = await fetch('https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    if (vehiclesRes.ok) {
      const { response: vehicles } = await vehiclesRes.json()
      if (vehicles?.length === 1) {
        await adminClient.from('cars').update({ tesla_vehicle_id: String(vehicles[0].id) }).eq('id', carId)
      }
      // If multiple vehicles, redirect to selection page
      if (vehicles?.length > 1) {
        const list = encodeURIComponent(JSON.stringify(vehicles.map((v: any) => ({ id: v.id, name: v.display_name, vin: v.vin }))))
        return NextResponse.redirect(new URL(`/host/fleet/${carId}/select-tesla?vehicles=${list}`, req.url))
      }
    }
  }

  return NextResponse.redirect(new URL(carId ? `/host/fleet/${carId}?tab=details&tesla=connected` : '/host/fleet?tesla=connected', req.url))
}
