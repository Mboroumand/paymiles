export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const statusStyle: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  active:    'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-600 border-red-200',
}

const insuranceLabel: Record<string, string> = {
  basic:    'Basic (your own policy)',
  standard: 'Standard — $500 deductible',
  premium:  'Premium — $0 deductible',
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: b } = await adminClient
    .from('bookings')
    .select('*, car:cars(*)')
    .eq('id', id)
    .eq('guest_id', user.id)
    .single()

  if (!b) notFound()

  const days = b.start_date && b.end_date
    ? Math.max(1, Math.round((new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / 86400000))
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="guest" />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard/bookings" className="text-gray-400 hover:text-gray-700 text-sm transition">← My Trips</Link>
        </div>

        {/* Car card */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mb-4">
          {b.car?.image_url && (
            <img src={b.car.image_url} alt={b.car.name} className="w-full h-48 object-cover" />
          )}
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{b.car?.name ?? 'Unknown Car'}</h1>
                <p className="text-gray-400 text-sm mt-0.5">{b.car?.year} · {b.car?.color}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusStyle[b.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                {b.status}
              </span>
            </div>
          </div>
        </div>

        {/* Trip details */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-4 space-y-4">
          <h2 className="font-semibold text-gray-900">Trip Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Pickup</p>
              <p className="text-gray-900 font-medium">{b.start_date ? fmt(b.start_date) : '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Return</p>
              <p className="text-gray-900 font-medium">{b.end_date ? fmt(b.end_date) : '—'}</p>
            </div>
            {days && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Duration</p>
                <p className="text-gray-900 font-medium">{days} day{days !== 1 ? 's' : ''}</p>
              </div>
            )}
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Rate</p>
              <p className="text-gray-900 font-medium">${b.rate_per_mile}/mile</p>
            </div>
            {b.delivery_requested && (
              <div className="col-span-2">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Delivery Address</p>
                <p className="text-gray-900 font-medium">{b.delivery_address ?? b.pickup_location ?? '—'}</p>
              </div>
            )}
            {b.insurance_plan && (
              <div className="col-span-2">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Insurance</p>
                <p className="text-gray-900 font-medium">{insuranceLabel[b.insurance_plan] ?? b.insurance_plan}</p>
              </div>
            )}
            {b.notes && (
              <div className="col-span-2">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Notes</p>
                <p className="text-gray-900">{b.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Mileage & Payment */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">Mileage & Payment</h2>
          <div className="space-y-3 text-sm">
            {b.odometer_start != null && (
              <div className="flex justify-between">
                <span className="text-gray-500">Start odometer</span>
                <span className="font-medium text-gray-900">{b.odometer_start.toLocaleString()} mi</span>
              </div>
            )}
            {b.odometer_end != null && (
              <div className="flex justify-between">
                <span className="text-gray-500">End odometer</span>
                <span className="font-medium text-gray-900">{b.odometer_end.toLocaleString()} mi</span>
              </div>
            )}
            {b.miles_driven != null && (
              <div className="flex justify-between">
                <span className="text-gray-500">Miles driven</span>
                <span className="font-medium text-gray-900">{b.miles_driven.toFixed(1)} mi</span>
              </div>
            )}
            {b.deposit_amount != null && (
              <div className="flex justify-between">
                <span className="text-gray-500">Deposit paid</span>
                <span className="font-medium text-gray-900">${b.deposit_amount.toFixed(2)}</span>
              </div>
            )}
            {b.total_amount != null && (
              <div className="flex justify-between border-t border-gray-100 pt-3 mt-3">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-green-600 text-base">${b.total_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Payment</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                b.payment_status === 'paid'
                  ? 'bg-green-50 text-green-600 border-green-200'
                  : 'bg-yellow-50 text-yellow-600 border-yellow-200'
              }`}>{b.payment_status ?? 'pending'}</span>
            </div>
          </div>
        </div>

        <p className="text-gray-400 text-xs text-center">Booking ID: {b.id}</p>
      </div>
    </div>
  )
}
