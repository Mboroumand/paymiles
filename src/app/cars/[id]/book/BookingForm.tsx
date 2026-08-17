'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Car } from '@/lib/types'

const inputCls = 'w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-gray-400 placeholder:text-gray-300 transition'
const labelCls = 'block text-xs font-medium text-gray-500 mb-1.5'

export default function BookingForm({
  car, userId, wantsDelivery = false,
}: {
  car: Car & { included_miles_per_day?: number }
  userId: string
  wantsDelivery?: boolean
}) {
  const router = useRouter()
  const includedPerDay = car.included_miles_per_day ?? 30

  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    deliveryAddress: '',
    phone: '',
    driverLicense: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  const { days, includedMiles, depositAmount } = useMemo(() => {
    if (!form.startDate || !form.endDate) return { days: 0, includedMiles: 0, depositAmount: 0 }
    const ms = new Date(form.endDate).getTime() - new Date(form.startDate).getTime()
    if (ms <= 0) return { days: 0, includedMiles: 0, depositAmount: 0 }
    const d = Math.ceil(ms / (1000 * 60 * 60 * 24))
    const m = d * includedPerDay
    return { days: d, includedMiles: m, depositAmount: m * car.rate_per_mile }
  }, [form.startDate, form.endDate, includedPerDay, car.rate_per_mile])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.startDate || !form.endDate) { setError('Please select both pickup and return dates'); return }
    if (wantsDelivery && !form.deliveryAddress) { setError('Please enter a delivery address'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('bookings').insert({
      guest_id: userId,
      car_id: car.id,
      status: 'pending',
      start_date: new Date(form.startDate).toISOString(),
      end_date: new Date(form.endDate).toISOString(),
      rate_per_mile: car.rate_per_mile,
      odometer_start: car.odometer_start,
      // included_miles and deposit_amount require DB migration — added after columns exist
      delivery_requested: wantsDelivery,
      delivery_address: wantsDelivery ? form.deliveryAddress : null,
      pickup_location: wantsDelivery ? form.deliveryAddress : null,
      phone: form.phone || null,
      driver_license: form.driverLicense || null,
      notes: form.notes || null,
    })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/dashboard/bookings')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {wantsDelivery && (
        <div className="bg-gray-900 text-white rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
          <span className="text-lg">🚗</span>
          <div>
            <p className="font-semibold">Delivery requested</p>
            <p className="text-gray-400 text-xs">Enter the address where you'd like the car delivered.</p>
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Pickup Date & Time *</label>
          <input type="datetime-local" value={form.startDate} onChange={update('startDate')} required
            min={new Date().toISOString().slice(0, 16)}
            className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Return Date & Time *</label>
          <input type="datetime-local" value={form.endDate} onChange={update('endDate')} required
            min={form.startDate || new Date().toISOString().slice(0, 16)}
            className={inputCls} />
        </div>
      </div>

      {/* Deposit summary — shown once dates are selected */}
      {days > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-800">Trip summary</p>
          <div className="space-y-1.5 text-sm">
            <Row label="Duration" value={`${days} day${days !== 1 ? 's' : ''}`} />
            <Row label={`Included miles (${includedPerDay}/day)`} value={`${includedMiles} miles`} />
            <Row label="Rate" value={`$${car.rate_per_mile}/mile`} />
          </div>
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700">Deposit due at booking</span>
              <span className="text-lg font-bold text-gray-900">${depositAmount.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Covers {includedMiles} included miles. Extra miles billed at ${car.rate_per_mile}/mi after trip.
            </p>
          </div>
        </div>
      )}

      {wantsDelivery && (
        <div>
          <label className={labelCls}>Delivery Address *</label>
          <input value={form.deliveryAddress} onChange={update('deliveryAddress')} required={wantsDelivery}
            placeholder="e.g. 456 Ocean Ave, San Diego, CA 92101"
            className={inputCls} />
          <p className="text-xs text-gray-400 mt-1">The host will confirm if delivery to this address is possible.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Phone Number</label>
          <input value={form.phone} onChange={update('phone')} placeholder="+1 (555) 000-0000" type="tel"
            className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Driver's License #</label>
          <input value={form.driverLicense} onChange={update('driverLicense')} placeholder="DL12345678"
            className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Notes <span className="text-gray-300">(optional)</span></label>
        <textarea value={form.notes} onChange={update('notes')} rows={3}
          placeholder="Any special requests or information for the host…"
          className={`${inputCls} resize-none`} />
      </div>

      {/* How billing works */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-gray-600 space-y-1.5">
        <p className="font-semibold text-blue-700">How billing works</p>
        <p>1. A deposit covering <strong>{includedPerDay} miles/day</strong> is charged at booking.</p>
        <p>2. If you drive more, extra miles are billed at <strong>${car.rate_per_mile}/mi</strong> after the trip ends.</p>
        <p>3. If you drive less than included miles, the deposit covers the minimum — hosts are guaranteed payment.</p>
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white py-3.5 rounded-xl font-semibold transition text-base">
        {loading ? 'Booking…' : wantsDelivery ? 'Request Delivery & Book' : `Confirm & Pay Deposit${depositAmount > 0 ? ` $${depositAmount.toFixed(2)}` : ''}`}
      </button>
    </form>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  )
}
