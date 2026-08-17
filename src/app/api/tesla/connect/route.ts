import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/auth/login')

  const carId = req.nextUrl.searchParams.get('carId') ?? ''

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.TESLA_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://paymiles.vercel.app'}/api/tesla/callback`,
    scope: 'openid offline_access vehicle_device_data',
    state: `${user.id}:${carId}`,
  })

  return redirect(`https://auth.tesla.com/oauth2/v3/authorize?${params}`)
}
