export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const badge: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  active: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-600 border-red-200',
}

export default async function HostTripsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'host' && profile?.role !== 'admin') redirect('/dashboard')

  const { data: cars } = await adminClient.from('cars').select('id').eq('host_id', user.id)
  const carIds = (cars ?? []).map(c => c.id)

  const { data: trips } = carIds.length
    ? await adminClient
        .from('bookings')
        .select('*, car:cars(name, model, image_url, rate_per_mile), guest:profiles(full_name, email)')
        .in('car_id', carIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const active = (trips ?? []).filter(t => t.status === 'active')
  const past = (trips ?? []).filter(t => t.status !== 'active')

  function TripRow({ trip }: { trip: any }) {
    return (
      <Link href={`/host/trips/${trip.id}`}
        className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition">
        {trip.car?.image_url ? (
          <img src={trip.car.image_url} className="w-14 h-10 rounded-lg object-cover flex-shrink-0" alt="" />
        ) : (
          <div className="w-14 h-10 rounded-lg bg-gray-100 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 truncate">{trip.car?.name ?? '—'}</p>
          <p className="text-gray-400 text-xs">{trip.guest?.full_name ?? trip.guest?.email ?? 'Guest'}</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-gray-400 text-xs">{new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          {trip.end_date && <p className="text-gray-400 text-xs">→ {new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>}
        </div>
        <div className="text-right min-w-[70px]">
          {trip.miles_driven != null ? (
            <p className="text-sm font-medium text-gray-700">{trip.miles_driven.toFixed(1)} mi</p>
          ) : (
            <p className="text-gray-300 text-sm">— mi</p>
          )}
          {trip.total_amount != null && (
            <p className="text-green-600 text-xs font-semibold">${trip.total_amount.toFixed(2)}</p>
          )}
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex-shrink-0 ${badge[trip.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
          {trip.status}
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-300 flex-shrink-0">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </Link>
    )
  }

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Trips</h1>

      {!trips?.length && (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center text-gray-400 shadow-sm">
          No trips yet
        </div>
      )}

      {active.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Active ({active.length})</h2>
          </div>
          <div className="bg-white border border-blue-200 rounded-2xl overflow-hidden shadow-sm">
            {active.map(t => <TripRow key={t.id} trip={t} />)}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">History ({past.length})</h2>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {past.map(t => <TripRow key={t.id} trip={t} />)}
          </div>
        </div>
      )}
    </div>
  )
}
