export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import CheckinForm from '../checkin/CheckinForm'

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'host' && profile?.role !== 'admin') redirect('/dashboard')

  const { data: trip } = await adminClient
    .from('bookings')
    .select('id, status, car:cars(name, host_id, rate_per_mile)')
    .eq('id', id)
    .single()

  if (!trip) notFound()
  if (profile?.role !== 'admin' && trip.car?.host_id !== user.id) notFound()

  // Must have checked in first
  const { data: checkin } = await adminClient
    .from('trip_inspections')
    .select('id, odometer, battery_percent')
    .eq('booking_id', id)
    .eq('phase', 'checkin')
    .single()

  if (!checkin) redirect(`/host/trips/${id}`)

  // Already checked out?
  const { data: existing } = await adminClient
    .from('trip_inspections')
    .select('id')
    .eq('booking_id', id)
    .eq('phase', 'checkout')
    .single()

  if (existing) redirect(`/host/trips/${id}`)

  return (
    <div className="p-8 max-w-3xl">
      <Link href={`/host/trips/${id}`} className="text-gray-500 hover:text-gray-900 text-sm flex items-center gap-1.5 mb-6 transition">
        ← Back to Trip
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">🏁</div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Check-out Inspection</h1>
          <p className="text-gray-400 text-sm">{trip.car?.name} — post-trip condition</p>
        </div>
      </div>

      {/* Check-in reference card */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 mb-8">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Check-in readings (reference)</p>
        <div className="flex gap-8">
          <div>
            <p className="text-xs text-gray-400">Odometer at start</p>
            <p className="text-lg font-bold text-gray-900">{checkin.odometer.toLocaleString()} mi</p>
          </div>
          {checkin.battery_percent != null && (
            <div>
              <p className="text-xs text-gray-400">Battery at start</p>
              <p className="text-lg font-bold text-gray-900">{checkin.battery_percent}%</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400">Rate</p>
            <p className="text-lg font-bold text-gray-900">${trip.car?.rate_per_mile}/mi</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-8 text-sm text-blue-800">
        <strong>Return inspection:</strong> photograph the full exterior, interior, odometer, and charging screen. Miles driven will be calculated automatically from the odometer readings.
      </div>

      <CheckinForm bookingId={id} phase="checkout" existingOdometer={checkin.odometer} />
    </div>
  )
}
