import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Car, DollarSign, Clock, CheckCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role === 'admin') redirect('/admin')
  if (profile?.role === 'host') redirect('/host')

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
    <div className="min-h-screen">
      <Navbar role="guest" />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-1">Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Driver'}</h1>
        <p className="text-gray-400 mb-8">{user.email}</p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Car, label: 'Active Rentals', value: active, color: 'blue' },
            { icon: Clock, label: 'Total Miles', value: totalMiles.toFixed(0), color: 'purple' },
            { icon: DollarSign, label: 'Total Spent', value: `$${totalSpent.toFixed(2)}`, color: 'green' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-gray-900 border border-white/10 rounded-xl p-6 flex items-center gap-4">
              <div className={`bg-${color}-600/20 p-3 rounded-lg`}>
                <Icon className={`text-${color}-400`} size={22} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent bookings */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Bookings</h2>
          <Link href="/dashboard/bookings" className="text-blue-400 hover:underline text-sm">View all →</Link>
        </div>

        <div className="space-y-3">
          {(!bookings || bookings.length === 0) && (
            <div className="bg-gray-900 border border-white/10 rounded-xl p-8 text-center text-gray-500">
              No bookings yet.{' '}
              <Link href="/cars" className="text-blue-400 hover:underline">Browse cars</Link>
            </div>
          )}
          {bookings?.map(b => (
            <div key={b.id} className="bg-gray-900 border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="font-semibold">{b.car?.name ?? 'Unknown Car'}</p>
                <p className="text-gray-400 text-sm">{new Date(b.start_date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-4">
                {b.miles_driven != null && (
                  <span className="text-gray-300 text-sm">{b.miles_driven.toFixed(1)} mi</span>
                )}
                {b.total_amount != null && (
                  <span className="text-blue-400 font-semibold">${b.total_amount.toFixed(2)}</span>
                )}
                <span className={`text-xs px-2.5 py-1 rounded-full border ${
                  b.status === 'active' ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' :
                  b.status === 'completed' ? 'bg-green-600/20 text-green-400 border-green-500/30' :
                  b.status === 'cancelled' ? 'bg-red-600/20 text-red-400 border-red-500/30' :
                  'bg-yellow-600/20 text-yellow-400 border-yellow-500/30'
                }`}>{b.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Link href="/cars" className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition">
            Book Another Car →
          </Link>
        </div>
      </div>
    </div>
  )
}
