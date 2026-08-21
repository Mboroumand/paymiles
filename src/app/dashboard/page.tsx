export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

const statusStyle: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  active: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-600 border-red-200',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await adminClient.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role === 'admin') redirect('/admin')
  if (profile?.role === 'host') redirect('/host')

  const { data: wallet } = await adminClient.from('wallets').select('balance').eq('user_id', user.id).single()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, car:cars(*)')
    .eq('guest_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const active = bookings?.filter(b => b.status === 'active').length ?? 0
  const totalMiles = bookings?.reduce((sum, b) => sum + (b.miles_driven ?? 0), 0) ?? 0
  const totalSpent = bookings?.reduce((sum, b) => sum + (b.total_amount ?? 0), 0) ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="guest" />

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Driver'}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">{user.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Active Rentals', value: active, icon: '🚗', color: 'text-blue-600' },
            { label: 'Total Miles', value: `${totalMiles.toFixed(0)} mi`, icon: '📍', color: 'text-purple-600' },
            { label: 'Total Spent', value: `$${totalSpent.toFixed(0)}`, icon: '💳', color: 'text-green-600' },
          { label: 'Wallet Balance', value: `$${(wallet?.balance ?? 0).toFixed(2)}`, icon: '👛', color: 'text-indigo-600' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <span className="text-2xl">{icon}</span>
              <p className="text-gray-400 text-xs mt-3 font-medium uppercase tracking-wider">{label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Recent bookings */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Trips</h2>
          <Link href="/dashboard/bookings" className="text-sm text-gray-400 hover:text-gray-700 transition">View all →</Link>
        </div>

        <div className="space-y-3 mb-8">
          {(!bookings || bookings.length === 0) && (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400 shadow-sm">
              No trips yet.{' '}
              <Link href="/cars" className="text-gray-900 font-semibold underline">Browse cars →</Link>
            </div>
          )}
          {bookings?.map(b => (
            <Link key={b.id} href={`/dashboard/bookings/${b.id}`}
              className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:border-gray-300 transition">
              {b.car?.image_url ? (
                <img src={b.car.image_url} className="w-16 h-11 rounded-lg object-cover flex-shrink-0" alt="" />
              ) : (
                <div className="w-16 h-11 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center text-xl">🚗</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{b.car?.name ?? '—'}</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {new Date(b.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {b.end_date && (
                    <> → {new Date(b.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {b.miles_driven != null && (
                  <span className="text-gray-500 text-sm">{b.miles_driven.toFixed(1)} mi</span>
                )}
                {b.total_amount != null && (
                  <span className="text-green-600 font-bold text-sm">${b.total_amount.toFixed(2)}</span>
                )}
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusStyle[b.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {b.status}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <Link href="/dashboard/wallet"
          className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-gray-300 transition mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👛</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">My Wallet</p>
              <p className="text-gray-400 text-xs">Balance: ${(wallet?.balance ?? 0).toFixed(2)}</p>
            </div>
          </div>
          <span className="text-gray-400 text-sm">→</span>
        </Link>

        <Link href="/cars"
          className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold transition text-sm">
          Browse cars
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
