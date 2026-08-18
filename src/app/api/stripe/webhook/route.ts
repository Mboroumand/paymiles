import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-07-29.dahlia' })

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

    function timeToHours(t: string): number {
      const [time, ampm] = t.split(' ')
      let [h, min] = time.split(':').map(Number)
      if (ampm === 'PM' && h !== 12) h += 12
      if (ampm === 'AM' && h === 12) h = 0
      return h + min / 60
    }

    const startH = timeToHours(m.startTime)
    const endH = timeToHours(m.endTime)
    const startISO = new Date(new Date(m.startDate + 'T00:00:00').getTime() + startH * 3600000).toISOString()
    const endISO = new Date(new Date(m.endDate + 'T00:00:00').getTime() + endH * 3600000).toISOString()

    await adminClient.from('bookings').insert({
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
    })
  }

  return NextResponse.json({ received: true })
}
