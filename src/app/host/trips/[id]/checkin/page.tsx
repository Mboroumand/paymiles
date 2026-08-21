export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import CheckinForm from './CheckinForm'

export default async function CheckinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'host' && profile?.role !== 'admin') redirect('/dashboard')

  const { data: trip } = await adminClient
    .from('bookings')
    .select('id, status, car:cars(name, host_id)')
    .eq('id', id)
    .single()

  if (!trip) notFound()
  if (profile?.role !== 'admin' && trip.car?.host_id !== user.id) notFound()

  // Already checked in?
  const { data: existing } = await adminClient
    .from('trip_inspections')
    .select('id')
    .eq('booking_id', id)
    .eq('phase', 'checkin')
    .single()

  if (existing) redirect(`/host/trips/${id}`)

  return (
    <div className="p-8 max-w-3xl">
      <Link href={`/host/trips/${id}`} className="text-gray-500 hover:text-gray-900 text-sm flex items-center gap-1.5 mb-6 transition">
        ← Back to Trip
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">📋</div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Check-in Inspection</h1>
          <p className="text-gray-400 text-sm">{trip.car?.name} — pre-trip condition</p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-8 text-sm text-green-800">
        <strong>Before handing over the car:</strong> photograph the exterior (all 4 sides), interior, dashboard, odometer reading, and charging percentage. This protects both you and the guest.
      </div>

      <CheckinForm bookingId={id} phase="checkin" />
    </div>
  )
}
