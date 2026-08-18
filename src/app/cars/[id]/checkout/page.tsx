export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import CheckoutForm from './CheckoutForm'

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { id } = await params
  const sp = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/cars/${id}/checkout`)

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
  const { data: car } = await adminClient.from('cars')
    .select('*, host:profiles!cars_host_id_fkey(full_name)')
    .eq('id', id).single()
  if (!car) redirect('/cars')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role={profile?.role} />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Confirm your trip</h1>
        <CheckoutForm car={car} userId={user.id} params={sp} />
      </div>
    </div>
  )
}
