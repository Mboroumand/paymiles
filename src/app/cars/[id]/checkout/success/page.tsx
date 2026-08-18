export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'

export default async function BookingSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let role: string | undefined
  if (user) {
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    role = data?.role
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role={role} />
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">You're booked!</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Your payment was successful and your trip is confirmed.<br />
          The host will be notified and your car will be ready for you.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard/bookings"
            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition">
            View my trips
          </Link>
          <Link href="/cars"
            className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:border-gray-400 transition">
            Browse more cars
          </Link>
        </div>
      </div>
    </div>
  )
}
