export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import TripActions from './TripActions'

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'host' && profile?.role !== 'admin') redirect('/dashboard')

  const { data: trip } = await adminClient
    .from('bookings')
    .select('*, car:cars(*)')
    .eq('id', id)
    .single()

  if (!trip) notFound()
  if (profile?.role !== 'admin' && trip.car?.host_id !== user.id) notFound()

  const { data: guest } = trip.guest_id
    ? await adminClient.from('profiles').select('id, full_name, email, created_at').eq('id', trip.guest_id).single()
    : { data: null }

  // Fetch inspections
  const { data: inspections } = await adminClient
    .from('trip_inspections')
    .select('*, photos:trip_inspection_photos(id, url, label)')
    .eq('booking_id', id)
    .order('created_at')

  const checkin = inspections?.find(i => i.phase === 'checkin')
  const checkout = inspections?.find(i => i.phase === 'checkout')

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    active: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-600 border-red-200',
  }

  const earnings = trip.total_amount ?? (trip.miles_driven && trip.car?.rate_per_mile ? trip.miles_driven * trip.car.rate_per_mile : null)

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/host/trips" className="text-gray-500 hover:text-gray-900 text-sm flex items-center gap-1.5 mb-6 transition">
        ← Back to Trips
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{trip.car?.name ?? 'Trip'}</h1>
          <p className="text-gray-400 text-sm mt-1">ID: <span className="font-mono text-xs">{trip.id}</span></p>
        </div>
        <span className={`text-sm px-3 py-1.5 rounded-full border font-medium ${statusColor[trip.status] ?? 'bg-gray-100 text-gray-500'}`}>
          {trip.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Customer */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Customer</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
              {(guest?.full_name ?? guest?.email ?? '?')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm">{guest?.full_name ?? '—'}</p>
              <p className="text-gray-400 text-xs">{guest?.email ?? '—'}</p>
            </div>
          </div>
        </div>

        {/* Vehicle */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Vehicle</p>
          {trip.car?.image_url && (
            <img src={trip.car.image_url} alt={trip.car.name} className="w-full h-28 object-cover rounded-xl mb-3" />
          )}
          <p className="font-semibold text-sm">{trip.car?.name ?? '—'}</p>
          <p className="text-gray-400 text-xs">{trip.car?.year}{trip.car?.color ? ` · ${trip.car.color}` : ''}</p>
        </div>

        {/* Trip Details */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Trip Details</p>
          <div className="space-y-2.5">
            <Row label="Start date" value={trip.start_date ? new Date(trip.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—'} />
            <Row label="End date" value={trip.end_date ? new Date(trip.end_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—'} />
            {trip.delivery_requested && <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-700">🚗 Delivery requested — {trip.delivery_address}</div>}
          </div>
        </div>

        {/* Earnings */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Earnings</p>
          <div className="space-y-2.5">
            <Row label="Miles driven" value={trip.miles_driven != null ? `${trip.miles_driven.toFixed(1)} mi` : '—'} />
            <Row label="Rate" value={trip.car?.rate_per_mile != null ? `$${trip.car.rate_per_mile}/mi` : '—'} />
            <div className="pt-2.5 border-t border-gray-100 flex justify-between">
              <span className="text-gray-400 text-sm">You earn (75%)</span>
              <span className="text-green-600 text-xl font-bold">
                {earnings != null ? `$${(earnings * 0.75).toFixed(2)}` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Check-in / Check-out status */}
      <div className="mb-6">
        <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Inspection Status</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Check-in */}
          <div className={`bg-white border rounded-2xl p-5 ${checkin ? 'border-green-200' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${checkin ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {checkin ? '✓' : '1'}
              </span>
              <p className="text-sm font-semibold text-gray-900">Check-in</p>
            </div>
            {checkin ? (
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500">Odometer: <span className="font-semibold text-gray-900">{checkin.odometer.toLocaleString()} mi</span></p>
                {checkin.battery_percent != null && (
                  <p className="text-xs text-gray-500">Battery: <span className="font-semibold text-gray-900">{checkin.battery_percent}%</span></p>
                )}
                <p className="text-xs text-gray-400">{checkin.photos?.length ?? 0} photos</p>
                {checkin.notes && <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1.5 mt-2 italic">{checkin.notes}</p>}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Not yet completed</p>
            )}
            {checkin && checkin.photos?.length > 0 && (
              <div className="flex gap-1 mt-3 overflow-x-auto">
                {checkin.photos.slice(0, 6).map((p: any) => (
                  <img key={p.id} src={p.url} alt={p.label} className="w-12 h-9 rounded-lg object-cover flex-shrink-0" title={p.label} />
                ))}
                {(checkin.photos.length ?? 0) > 6 && (
                  <div className="w-12 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400 flex-shrink-0 font-medium">
                    +{checkin.photos.length - 6}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Check-out */}
          <div className={`bg-white border rounded-2xl p-5 ${checkout ? 'border-blue-200' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${checkout ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {checkout ? '✓' : '2'}
              </span>
              <p className="text-sm font-semibold text-gray-900">Check-out</p>
            </div>
            {checkout ? (
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500">Odometer: <span className="font-semibold text-gray-900">{checkout.odometer.toLocaleString()} mi</span></p>
                {checkout.battery_percent != null && (
                  <p className="text-xs text-gray-500">Battery: <span className="font-semibold text-gray-900">{checkout.battery_percent}%</span></p>
                )}
                <p className="text-xs text-gray-500">Miles driven: <span className="font-bold text-green-600">{checkin ? (checkout.odometer - checkin.odometer).toLocaleString() : '—'} mi</span></p>
                <p className="text-xs text-gray-400">{checkout.photos?.length ?? 0} photos</p>
                {checkout.notes && <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1.5 mt-2 italic">{checkout.notes}</p>}
              </div>
            ) : (
              <p className="text-xs text-gray-400">{checkin ? 'Ready to check out' : 'Complete check-in first'}</p>
            )}
            {checkout && checkout.photos?.length > 0 && (
              <div className="flex gap-1 mt-3 overflow-x-auto">
                {checkout.photos.slice(0, 6).map((p: any) => (
                  <img key={p.id} src={p.url} alt={p.label} className="w-12 h-9 rounded-lg object-cover flex-shrink-0" title={p.label} />
                ))}
                {(checkout.photos.length ?? 0) > 6 && (
                  <div className="w-12 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400 flex-shrink-0 font-medium">
                    +{checkout.photos.length - 6}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inspection action buttons */}
      {!checkin && (trip.status === 'pending' || trip.status === 'active') && (
        <div className="mb-4">
          <Link href={`/host/trips/${id}/checkin`}
            className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-xl transition text-sm">
            📋 Start Check-in Inspection
          </Link>
        </div>
      )}

      {checkin && !checkout && trip.status === 'active' && (
        <div className="mb-4">
          <Link href={`/host/trips/${id}/checkout`}
            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition text-sm">
            🏁 Start Check-out Inspection
          </Link>
        </div>
      )}

      {/* Status actions */}
      <div>
        <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Trip Actions</h2>
        <TripActions tripId={trip.id} status={trip.status} hasCheckin={!!checkin} />
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  )
}
