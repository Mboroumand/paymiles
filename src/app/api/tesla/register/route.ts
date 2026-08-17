import { NextResponse } from 'next/server'

export async function GET() {
  const appUrl = 'https://paymiles.vercel.app'

  // Get a partner token first
  const tokenRes = await fetch('https://auth.tesla.com/oauth2/v3/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.TESLA_CLIENT_ID!,
      client_secret: process.env.TESLA_CLIENT_SECRET!,
      scope: 'openid vehicle_device_data',
      audience: 'https://fleet-api.prd.na.vn.cloud.tesla.com',
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    return NextResponse.json({ error: 'Partner token failed', detail: err }, { status: 500 })
  }

  const { access_token } = await tokenRes.json()

  // Register partner account with Tesla
  const regRes = await fetch('https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/partner_accounts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ domain: 'paymiles.vercel.app' }),
  })

  const regData = await regRes.json()

  return NextResponse.json({
    status: regRes.status,
    ok: regRes.ok,
    result: regData,
  })
}
