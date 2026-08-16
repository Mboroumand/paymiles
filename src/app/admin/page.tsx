import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Car, Users, BookOpen, DollarSign } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [{ count: totalCars }, { count: totalUsers }, { count: activeBookings }, { data: revenue }] = await Promise.all([
    supabase.from('cars').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'guest'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('bookings').select('total_amount').eq('payment_status', 'paid'),
  ])

  const totalRevenue = revenue?.reduce((sum, b) => sum + (b.total_amount ?? 0), 0) ?? 0

  const { data: recentBookings } = await supabase
    .from('bookings')
    .select('*, car:cars(name), guest:profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div className="min-h-screen">
      <Navbar role="admin" />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-gray-400 mb-8">Paymiles fleet management</p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Car, label: 'Total Cars', value: totalCars ?? 0, href: '/admin/cars', color: 'blue' },
            { icon: Users, label: 'Guests', value: totalUsers ?? 0, href: '/admin/users', color: 'purple' },
            { icon: BookOpen, label: 'Active Rentals', value: activeBookings ?? 0, href: '/admin/bookings', color: 'yellow' },
            { icon: DollarSign, label: 'Revenue Collected', value: `$${totalRevenue.toFixed(2)}`, href: '/admin/bookings', color: 'green' },
          ].map(({ icon: Icon, label, value, href, color }) => (
            <Link key={label} href={href} className={`bg-gray-900 border border-white/10 rounded-xl p-6 hover:border-${color}-500/40 transition`}>
              <div className={`bg-${color}-600/20 w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`text-${color}-400`} size={20} />
              </div>
              <p className="text-gray-400 text-sm">{label}</p>
              <p className="text-2xl font-bold mt-0.5">{value}</p>
            </Link>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { href: '/admin/cars', label: 'Manage Cars', desc: 'Add, edit, link Tesla vehicles' },
            { href: '/admin/bookings', label: 'Manage Bookings', desc: 'Start / complete rentals, log miles' },
            { href: '/admin/users', label: 'Manage Users', desc: 'View guests, promote to admin' },
          ].map(({ href, label, desc }) => (
            <Link key={href} href={href} className="bg-gray-900 border border-white/10 rounded-xl p-6 hover:border-blue-500/40 transition">
              <h3 className="font-semibold mb-1">{label}</h3>
              <p className="text-gray-400 text-sm">{desc}</p>
            </Link>
          ))}
        </div>

        {/* Recent bookings */}
        <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
        <div className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-gray-400">
              <tr>
                {['Guest', 'Car', 'Status', 'Miles', 'Amount', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentBookings?.map(b => (
                <tr key={b.id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3">
                    <p>{b.guest?.full_name ?? '—'}</p>
                    <p className="text-gray-500 text-xs">{b.guest?.email}</p>
                  </td>
                  <td className="px-4 py-3">{b.car?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      b.status === 'active' ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' :
                      b.status === 'completed' ? 'bg-green-600/20 text-green-400 border-green-500/30' :
                      'bg-yellow-600/20 text-yellow-400 border-yellow-500/30'
                    }`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3">{b.miles_driven != null ? `${b.miles_driven.toFixed(1)} mi` : '—'}</td>
                  <td className="px-4 py-3">{b.total_amount != null ? `$${b.total_amount.toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(b.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
