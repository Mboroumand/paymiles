import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-07-29.dahlia' })

async function getOrCreateWallet(userId: string) {
  const { data: existing } = await adminClient.from('wallets').select('id, balance').eq('user_id', userId).single()
  if (existing) return existing
  const { data: created } = await adminClient.from('wallets').insert({ user_id: userId, balance: 0 }).select('id, balance').single()
  return created!
}

async function creditWallet(userId: string, amount: number, type: string, description: string, referenceId?: string) {
  const wallet = await getOrCreateWallet(userId)
  await adminClient.from('wallets').update({ balance: wallet.balance + amount }).eq('id', wallet.id)
  await adminClient.from('wallet_transactions').insert({
    wallet_id: wallet.id, amount, type, description, reference_id: referenceId,
  })
}

async function debitWallet(userId: string, amount: number, type: string, description: string, referenceId?: string) {
  const wallet = await getOrCreateWallet(userId)
  await adminClient.from('wallets').update({ balance: wallet.balance - amount }).eq('id', wallet.id)
  await adminClient.from('wallet_transactions').insert({
    wallet_id: wallet.id, amount: -amount, type, description, reference_id: referenceId,
  })
}

function timeToHours(t: string): number {
  const [time, ampm] = t.split(' ')
  let [h, min] = time.split(':').map(Number)
  if (ampm === 'PM' && h !== 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  return h + min / 60
}

const FSD_CAPABLE = ['TeslaAP3', 'TeslaAP4', 'FULL_SELF_DRIVING', 'FSD']

async function checkFsdInBackground(carId: string) {
  const { data: car } = await adminClient.from('cars').select('tesla_vehicle_id, host_id').eq('id', carId).single()
  if (!car?.tesla_vehicle_id) return

  const { data: profile } = await adminClient.from('profiles')
    .select('tesla_access_token, tesla_refresh_token, tesla_token_expires_at')
    .eq('id', car.host_id).single()
  if (!profile?.tesla_access_token) return

  let token = profile.tesla_access_token
  if (profile.tesla_token_expires_at && new Date(profile.tesla_token_expires_at) < new Date()) {
    const r = await fetch('https://auth.tesla.com/oauth2/v3/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.TESLA_CLIENT_ID!,
        client_secret: process.env.TESLA_CLIENT_SECRET!,
        refresh_token: profile.tesla_refresh_token,
      }),
    })
    if (!r.ok) return
    const tokens = await r.json()
    await adminClient.from('profiles').update({
      tesla_access_token: tokens.access_token,
      tesla_refresh_token: tokens.refresh_token,
      tesla_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    }).eq('id', car.host_id)
    token = tokens.access_token
  }

  const res = await fetch(
    `https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles/${car.tesla_vehicle_id}/vehicle_data?endpoints=vehicle_config`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return

  const data = await res.json()
  const config = data?.response?.vehicle_config ?? {}
  const driverAssist: string = config.driver_assist ?? ''
  const autopilotVersion: string = config.autopilot_version ?? ''
  const hasFsd =
    FSD_CAPABLE.some(v => driverAssist.toUpperCase().includes(v.toUpperCase())) ||
    FSD_CAPABLE.some(v => autopilotVersion.toUpperCase().includes(v.toUpperCase())) ||
    config.full_self_driving === true

  await adminClient.from('cars').update({ has_fsd: hasFsd }).eq('id', carId)
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const m = session.metadata!

    // Wallet top-up
    if (m.type === 'wallet_topup') {
      const amount = parseFloat(m.amount)
      await creditWallet(m.userId, amount, 'topup', `Wallet top-up via Stripe`, session.id)
      return NextResponse.json({ received: true })
    }

    // Booking payment
    const startH = timeToHours(m.startTime)
    const endH = timeToHours(m.endTime)
    const startISO = new Date(new Date(m.startDate + 'T00:00:00').getTime() + startH * 3600000).toISOString()
    const endISO = new Date(new Date(m.endDate + 'T00:00:00').getTime() + endH * 3600000).toISOString()

    const { data: booking } = await adminClient.from('bookings').insert({
      guest_id: m.guestId,
      car_id: m.carId,
      status: 'pending',
      start_date: startISO,
      end_date: endISO,
      rate_per_mile: parseFloat(m.ratePerMile),
      delivery_requested: m.delivery === '1',
      delivery_address: m.delivery === '1' ? m.deliveryAddress : null,
      pickup_location: m.delivery === '1' ? m.deliveryAddress : null,
      phone: m.phone || null,
      driver_license: m.dl || null,
      notes: m.notes || null,
      insurance_plan: m.insurancePlan,
      stripe_payment_intent: session.payment_intent as string,
    }).select('id').single()

    // Re-check FSD status at booking time (subscription may have changed)
    if (booking) {
      checkFsdInBackground(m.carId).catch(() => {})
    }

    // Credit host wallet with platform fee deducted (10%)
    if (booking && m.totalAmount) {
      const total = parseFloat(m.totalAmount)
      const hostEarning = parseFloat((total * 0.9).toFixed(2))
      const { data: car } = await adminClient.from('cars').select('host_id').eq('id', m.carId).single()
      if (car?.host_id) {
        await creditWallet(car.host_id, hostEarning, 'earning',
          `Booking earned (after 10% fee)`, booking.id)
      }
      // Debit guest wallet if they paid with wallet
      if (m.paymentMethod === 'wallet' && m.guestId) {
        await debitWallet(m.guestId, total, 'payment', `Booking payment`, booking.id)
      }
    }
  }

  return NextResponse.json({ received: true })
}
