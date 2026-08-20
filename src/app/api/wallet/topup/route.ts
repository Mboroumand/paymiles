import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-07-29.dahlia' })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount } = await req.json()
  if (!amount || amount < 5) return NextResponse.json({ error: 'Minimum $5' }, { status: 400 })

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(amount * 100),
        product_data: { name: `Paymiles Wallet Top-up — $${amount}` },
      },
    }],
    metadata: { type: 'wallet_topup', userId: user.id, amount: String(amount) },
    success_url: `${req.nextUrl.origin}/dashboard/wallet?topup=success`,
    cancel_url: `${req.nextUrl.origin}/dashboard/wallet`,
  })

  return NextResponse.json({ url: session.url })
}
