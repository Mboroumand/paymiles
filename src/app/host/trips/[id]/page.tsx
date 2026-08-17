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

  // Verify this trip belongs to one of the host's cars
  if (profile?.role !== 'admin' && trip.car?.host_id !== user.id) notFound()

  // Fetch guest profile separately
  const { data: guest } = trip.guest_id
    ? await adminClient.from('profiles').select('id, full_name, email, created_at').eq('id', trip.guest_id).single()
    : { data: null }

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    active: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-600 border-red-200',
  }

  const earnings = trip.total_amount ?? (trip.miles_driven && trip.car?.rate_per_mile ? trip.miles_driven * trip.car.rate_per_mile : null)

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/host/trips" className="text-gray-500 hover:text-gray-900 text-sm flex items-center gap-1.5 mb-6 transition">
        ← Back to Trips
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{trip.car?.name ?? 'Trip'}</h1>
          <p className="text-gray-400 text-sm mt-1">Trip ID: <span className="font-mono text-xs">{trip.id}</span></p>
        </div>
        <span className={`text-sm px-3 py-1.5 rounded-full border font-medium ${statusColor[trip.status] ?? 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
          {trip.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Customer */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Customer</p>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold">
              {(guest?.full_name ?? guest?.email ?? '?')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{guest?.full_name ?? '—'}</p>
              <p className="text-gray-400 text-sm">{guest?.email ?? '—'}</p>
            </div>
          </div>
          {guest?.created_at && (
            <p className="text-gray-500 text-xs">Member since {new Date(guest.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          )}
        </div>

        {/* Car */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Vehicle</p>
          {trip.car?.image_url && (
            <img src={trip.car.image_url} alt={trip.car.name} className="w-full h-32 object-cover rounded-xl mb-3" />
          )}
          <p className="font-semibold">{trip.car?.name ?? '—'}</p>
          <p className="text-gray-400 text-sm">{trip.car?.year}{trip.car?.color ? ` · ${trip.car.color}` : ''}</p>
          {trip.car?.license_plate && <p className="text-gray-500 text-xs mt-1">{trip.car.license_plate}</p>}
        </div>

        {/* Trip Details */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Trip Details</p>
          <div className="space-y-3">
            <Row label="Start date" value={trip.start_date ? new Date(trip.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—'} />
            <Row label="End date" value={trip.end_date ? new Date(trip.end_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—'} />
            {trip.delivery_requested && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-sm text-yellow-700 font-medium flex items-center gap-2">
                🚗 Guest requested delivery
              </div>
            )}
            {trip.delivery_address && <Row label="Delivery address" value={trip.delivery_address} />}
            {!trip.delivery_requested && trip.pickup_location && <Row label="Pickup" value={trip.pickup_location} />}
            {trip.dropoff_location && <Row label="Drop-off" value={trip.dropoff_location} />}
          </div>
        </div>

        {/* Earnings */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Earnings</p>
          <div className="space-y-3">
            <Row label="Miles driven" value={trip.miles_driven != null ? `${trip.miles_driven.toFixed(1)} mi` : '—'} />
            <Row label="Rate" value={trip.car?.rate_per_mile != null ? `$${trip.car.rate_per_mile}/mi` : '—'} />
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm font-medium">Total Earned</span>
                <span className="text-green-600 text-xl font-bold">{earnings != null ? `$${earnings.toFixed(2)}` : '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6">
        <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Actions</h2>
        <TripActions tripId={trip.id} status={trip.status} />
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
