export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [
    { count: totalCars },
    { count: totalUsers },
    { count: activeBookings },
    { count: pendingCars },
  ] = await Promise.all([
    adminClient.from('cars').select('*', { count: 'exact', head: true }),
    adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'guest'),
    adminClient.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    adminClient.from('cars').select('*', { count: 'exact', head: true }).eq('listing_status', 'pending'),
  ])

  const { data: revenueRows } = await adminClient.from('bookings').select('total_amount').not('total_amount', 'is', null)
  const totalRevenue = revenueRows?.reduce((s, b) => s + (b.total_amount ?? 0), 0) ?? 0

  const { data: recentBookings } = await adminClient
    .from('bookings')
    .select('*, car:cars(name, image_url), guest:profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(8)

  const statusStyle: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    active: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 text-sm mt-0.5">Paymiles admin console</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Cars', value: totalCars ?? 0, href: '/admin/cars', bg: 'bg-blue-50', text: 'text-blue-700', icon: '🚗' },
          { label: 'Guests', value: totalUsers ?? 0, href: '/admin/users', bg: 'bg-purple-50', text: 'text-purple-700', icon: '👥' },
          { label: 'Active Trips', value: activeBookings ?? 0, href: '/admin/bookings', bg: 'bg-green-50', text: 'text-green-700', icon: '🟢' },
          { label: 'Revenue', value: `$${totalRevenue.toFixed(0)}`, href: '/admin/bookings', bg: 'bg-orange-50', text: 'text-orange-700', icon: '💰' },
        ].map(({ label, value, href, bg, text, icon }) => (
          <Link key={label} href={href}
            className={`${bg} border border-gray-200 hover:border-gray-300 rounded-2xl p-5 transition group`}>
            <div className="text-2xl mb-3">{icon}</div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${text}`}>{value}</p>
          </Link>
        ))}
      </div>

      {/* Pending alert */}
      {(pendingCars ?? 0) > 0 && (
        <Link href="/admin/cars"
          className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 hover:bg-amber-100 transition">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-amber-800 font-semibold text-sm">
              {pendingCars} car{(pendingCars ?? 0) > 1 ? 's' : ''} waiting for approval
            </span>
          </div>
          <span className="text-amber-600 text-sm font-medium">Review →</span>
        </Link>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { href: '/admin/cars', title: 'Manage Cars', desc: 'Approve listings, add vehicles', icon: '🚘', color: 'hover:border-blue-300' },
          { href: '/admin/bookings', title: 'Bookings', desc: 'View and manage all trips', icon: '📋', color: 'hover:border-green-300' },
          { href: '/admin/users', title: 'Users', desc: 'Promote hosts and admins', icon: '👤', color: 'hover:border-purple-300' },
        ].map(({ href, title, desc, icon, color }) => (
          <Link key={href} href={href}
            className={`bg-white border border-gray-200 ${color} rounded-2xl p-5 transition shadow-sm hover:shadow`}>
            <span className="text-xl">{icon}</span>
            <p className="font-semibold text-gray-900 mt-3 text-sm">{title}</p>
            <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Bookings</h2>
          <Link href="/admin/bookings" className="text-gray-400 hover:text-gray-700 text-sm transition">View all →</Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
            <span>Guest</span><span>Car</span><span>Status</span><span>Miles</span><span>Amount</span><span>Date</span>
          </div>

          {(!recentBookings || recentBookings.length === 0) && (
            <p className="text-gray-400 text-sm text-center py-12">No bookings yet</p>
          )}

          {recentBookings?.map((b, i) => (
            <div key={b.id}
              className={`grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-4 items-center text-sm hover:bg-gray-50 transition ${i !== 0 ? 'border-t border-gray-100' : ''}`}>
              <div>
                <p className="text-gray-900 font-medium truncate">{b.guest?.full_name ?? '—'}</p>
                <p className="text-gray-400 text-xs truncate">{b.guest?.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {b.car?.image_url && <img src={b.car.image_url} className="w-8 h-6 rounded object-cover flex-shrink-0" alt="" />}
                <span className="text-gray-700 truncate">{b.car?.name ?? '—'}</span>
              </div>
              <div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusStyle[b.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {b.status}
                </span>
              </div>
              <span className="text-gray-600">{b.miles_driven != null ? `${b.miles_driven.toFixed(1)} mi` : '—'}</span>
              <span className={b.total_amount != null ? 'text-green-600 font-semibold' : 'text-gray-300'}>
                {b.total_amount != null ? `$${b.total_amount.toFixed(2)}` : '—'}
              </span>
              <span className="text-gray-400">{new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
