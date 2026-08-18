import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json()
  const { carId, startDate, endDate, startTime, endTime, delivery, deliveryAddress, phone, dl, notes, insurancePlan, totalAmount } = body

  const { data: car } = await adminClient.from('cars').select('name, rate_per_mile').eq('id', carId).single()
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

  const origin = req.headers.get('origin') ?? 'https://paymiles.vercel.app'

  // Store pending booking params in metadata so we can create the booking on success
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${car.name} — ${startDate} to ${endDate}`,
            description: `Pick up ${startTime} · Return ${endTime}${delivery === '1' ? ' · Delivery included' : ''}`,
          },
          unit_amount: Math.round(totalAmount * 100), // cents
        },
        quantity: 1,
      },
    ],
    metadata: {
      carId, guestId: user.id, startDate, endDate, startTime, endTime,
      delivery: delivery ?? '0',
      deliveryAddress: deliveryAddress ?? '',
      phone: phone ?? '',
      dl: dl ?? '',
      notes: notes ?? '',
      insurancePlan: insurancePlan ?? 'basic',
      ratePerMile: String(car.rate_per_mile),
    },
    success_url: `${origin}/cars/${carId}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cars/${carId}/checkout?cancelled=1`,
  })

  return NextResponse.json({ url: session.url })
}
