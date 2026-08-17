export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HostDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await adminClient.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (profile?.role !== 'host' && profile?.role !== 'admin') redirect('/dashboard')

  const { data: cars } = await adminClient.from('cars').select('*').eq('host_id', user.id).order('created_at', { ascending: false })
  const carIds = (cars ?? []).map(c => c.id)
  const { data: trips } = carIds.length
    ? await adminClient.from('bookings').select('*, car:cars(name, model, image_url)').in('car_id', carIds).order('created_at', { ascending: false })
    : { data: [] }

  const totalEarnings = (trips ?? []).reduce((s, t) => s + (t.total_amount ?? 0), 0)
  const totalMiles = (trips ?? []).reduce((s, t) => s + (t.miles_driven ?? 0), 0)
  const activeTrips = (trips ?? []).filter(t => t.status === 'active')
  const pendingCars = (cars ?? []).filter(c => c.listing_status === 'pending').length
  const approvedCars = (cars ?? []).filter(c => c.listing_status === 'approved').length

  const listingBadge: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-600 border-red-200',
  }
  const tripBadge: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    active: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-600 border-red-200',
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Here's your fleet at a glance</p>
        </div>
        <Link href="/host/cars/submit"
          className="bg-gray-900 text-white font-semibold px-4 py-2 rounded-xl text-sm hover:bg-gray-800 transition">
          + List a car
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Earnings', value: `$${totalEarnings.toFixed(0)}`, icon: '💰', color: 'text-green-600' },
          { label: 'Miles Driven', value: totalMiles.toFixed(0), icon: '📍', color: 'text-blue-600' },
          { label: 'Active Trips', value: activeTrips.length, icon: '🟢', color: 'text-blue-600' },
          { label: 'Listed Cars', value: approvedCars, icon: '🚗', color: 'text-gray-900', sub: pendingCars > 0 ? `${pendingCars} pending` : undefined },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <span className="text-xl">{s.icon}</span>
            <p className="text-gray-400 text-xs mt-3 font-medium uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            {s.sub && <p className="text-xs text-amber-500 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Active trips alert */}
      {activeTrips.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-blue-700 font-semibold text-sm">{activeTrips.length} active trip{activeTrips.length > 1 ? 's' : ''} in progress</span>
          </div>
          <Link href="/host/trips" className="text-blue-600 text-sm font-medium hover:underline">View →</Link>
        </div>
      )}

      {/* Fleet */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">My Fleet</h2>
        <Link href="/host/fleet" className="text-gray-400 text-sm hover:text-gray-700 transition">See all →</Link>
      </div>

      {!cars?.length ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="text-4xl mb-3">🚗</div>
          <p className="text-gray-700 font-semibold">No cars yet</p>
          <p className="text-gray-400 text-sm mt-1">List your first Tesla to start earning</p>
          <Link href="/host/cars/submit"
            className="inline-block mt-4 bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition">
            List a car
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cars.slice(0, 6).map(car => (
            <Link key={car.id} href={`/host/fleet/${car.id}`}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-md transition-all group">
              <div className="relative">
                {car.image_url ? (
                  <img src={car.image_url} alt={car.name} className="w-full h-40 object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                ) : (
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-3xl">🚗</div>
                )}
                <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full border font-medium ${listingBadge[car.listing_status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {car.listing_status}
                </span>
              </div>
              <div className="p-4">
                <p className="font-semibold text-gray-900">{car.name}</p>
                <p className="text-gray-400 text-sm">{car.year}{car.color ? ` · ${car.color}` : ''}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-blue-600 font-bold text-sm">${car.rate_per_mile}/mi</span>
                  {car.location && <span className="text-gray-400 text-xs truncate ml-2">📍 {car.location}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Recent trips */}
      {trips && trips.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Trips</h2>
            <Link href="/host/trips" className="text-gray-400 text-sm hover:text-gray-700 transition">See all →</Link>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {trips.slice(0, 5).map((trip, i) => (
              <Link key={trip.id} href={`/host/trips/${trip.id}`}
                className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition ${i !== 0 ? 'border-t border-gray-100' : ''}`}>
                <div className="flex items-center gap-3">
                  {trip.car?.image_url ? (
                    <img src={trip.car.image_url} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-sm text-gray-900">{trip.car?.name ?? 'Unknown car'}</p>
                    <p className="text-gray-400 text-xs">{new Date(trip.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {trip.miles_driven != null && <span className="text-gray-500 text-sm">{trip.miles_driven.toFixed(1)} mi</span>}
                  {trip.total_amount != null && <span className="text-green-600 font-semibold text-sm">${trip.total_amount.toFixed(2)}</span>}
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${tripBadge[trip.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    {trip.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
