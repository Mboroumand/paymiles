import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import BookingActions from './BookingActions'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
  active: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
  completed: 'bg-green-600/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-600/20 text-red-400 border-red-500/30',
}

export default async function AdminBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, car:cars(*), guest:profiles(full_name, email)')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen">
      <Navbar role="admin" />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-8">All Bookings</h1>

        <div className="space-y-4">
          {bookings?.map(b => (
            <div key={b.id} className="bg-gray-900 border border-white/10 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="font-semibold text-lg">{b.car?.name ?? '—'}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[b.status]}`}>{b.status}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      b.payment_status === 'paid'
                        ? 'bg-green-600/20 text-green-400 border-green-500/30'
                        : 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30'
                    }`}>{b.payment_status}</span>
                  </div>
                  <p className="text-gray-400 text-sm">Guest: {b.guest?.full_name ?? '—'} ({b.guest?.email})</p>
                  <p className="text-gray-500 text-xs mt-0.5">Start: {new Date(b.start_date).toLocaleString()}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm text-gray-400">Rate: <span className="text-white">${b.rate_per_mile}/mi</span></p>
                  {b.odometer_start != null && (
                    <p className="text-sm text-gray-400">Odo start: <span className="text-white">{b.odometer_start.toLocaleString()} mi</span></p>
                  )}
                  {b.odometer_end != null && (
                    <p className="text-sm text-gray-400">Odo end: <span className="text-white">{b.odometer_end.toLocaleString()} mi</span></p>
                  )}
                  {b.miles_driven != null && (
                    <p className="text-sm font-medium">Miles: {b.miles_driven.toFixed(1)} mi</p>
                  )}
                  {b.total_amount != null && (
                    <p className="text-xl font-bold text-blue-400">${b.total_amount.toFixed(2)}</p>
                  )}
                </div>
              </div>
              <BookingActions booking={b} car={b.car} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
