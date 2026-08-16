import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Tesla OAuth2 callback — exchanges code for tokens and saves them.
 * Usage: Admin initiates OAuth from the car settings page,
 * Tesla redirects back here with ?code=...&carId=...
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/login', req.url))

  const code = req.nextUrl.searchParams.get('code')
  const carId = req.nextUrl.searchParams.get('state') // we pass carId as state
  if (!code || !carId) return NextResponse.json({ error: 'Missing code or state' }, { status: 400 })

  const res = await fetch('https://auth.tesla.com/oauth2/v3/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: process.env.TESLA_CLIENT_ID,
      client_secret: process.env.TESLA_CLIENT_SECRET,
      code,
      redirect_uri: process.env.TESLA_REDIRECT_URI,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json({ error: 'Token exchange failed', detail: err }, { status: 502 })
  }

  const tokens = await res.json()
  await supabase.from('tesla_tokens').upsert({
    car_id: carId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'car_id' })

  return NextResponse.redirect(new URL('/admin/cars?linked=1', req.url))
}
