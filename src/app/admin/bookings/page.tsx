export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookingActions from './BookingActions'

const statusStyle: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  active: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

export default async function AdminBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: bookings } = await adminClient
    .from('bookings')
    .select('*, car:cars(*), guest:profiles(full_name, email)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Bookings</h1>
      <p className="text-gray-500 text-sm mb-8">{bookings?.length ?? 0} total trips</p>

      <div className="space-y-3">
        {(!bookings || bookings.length === 0) && (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center text-gray-400 shadow-sm">No bookings yet</div>
        )}
        {bookings?.map(b => (
          <div key={b.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition shadow-sm">
            <div className="flex gap-4">
              {b.car?.image_url ? (
                <img src={b.car.image_url} className="w-20 h-14 rounded-xl object-cover flex-shrink-0" alt="" />
              ) : (
                <div className="w-20 h-14 rounded-xl bg-gray-100 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{b.car?.name ?? '—'}</p>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${statusStyle[b.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {b.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mt-0.5">
                      {b.guest?.full_name ?? '—'}
                      <span className="text-gray-300 mx-1">·</span>
                      <span className="text-gray-400 text-xs">{b.guest?.email}</span>
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {new Date(b.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {b.total_amount != null ? (
                      <p className="text-green-600 font-bold text-xl">${b.total_amount.toFixed(2)}</p>
                    ) : (
                      <p className="text-gray-300 text-sm">—</p>
                    )}
                    {b.miles_driven != null && (
                      <p className="text-gray-500 text-sm">{b.miles_driven.toFixed(1)} mi</p>
                    )}
                    <p className="text-gray-400 text-xs">${b.rate_per_mile}/mi</p>
                  </div>
                </div>
                <BookingActions booking={b} car={b.car} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
