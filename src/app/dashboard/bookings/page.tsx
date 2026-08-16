import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
  active: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
  completed: 'bg-green-600/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-600/20 text-red-400 border-red-500/30',
}

export default async function BookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, car:cars(*)')
    .eq('guest_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen">
      <Navbar role="guest" />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <Link href="/cars" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition text-sm">
            + New Booking
          </Link>
        </div>

        {(!bookings || bookings.length === 0) ? (
          <div className="text-center py-24 text-gray-500">
            No bookings yet. <Link href="/cars" className="text-blue-400 hover:underline">Browse cars</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => (
              <div key={b.id} className="bg-gray-900 border border-white/10 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-semibold">{b.car?.name ?? 'Unknown'}</h2>
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColors[b.status]}`}>
                        {b.status}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {b.car?.year} · {b.car?.model} · {b.car?.color}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Booked: {new Date(b.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm text-gray-400">Rate: <span className="text-white font-medium">${b.rate_per_mile}/mile</span></p>
                    {b.odometer_start != null && (
                      <p className="text-sm text-gray-400">Start odometer: <span className="text-white">{b.odometer_start.toLocaleString()} mi</span></p>
                    )}
                    {b.miles_driven != null && (
                      <p className="text-sm text-gray-400">Miles driven: <span className="text-white font-medium">{b.miles_driven.toFixed(1)} mi</span></p>
                    )}
                    {b.total_amount != null && (
                      <p className="text-xl font-bold text-blue-400">${b.total_amount.toFixed(2)}</p>
                    )}
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${
                      b.payment_status === 'paid'
                        ? 'bg-green-600/20 text-green-400 border-green-500/30'
                        : 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30'
                    }`}>{b.payment_status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
