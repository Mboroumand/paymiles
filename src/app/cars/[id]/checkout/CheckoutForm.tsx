'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const DELIVERY_FEE = 99

const INSURANCE_PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0,
    desc: 'No additional coverage. You are responsible for damages up to your personal policy limits.',
    deductible: 'Your own policy',
    coverage: '$0/day',
    color: 'border-gray-200',
    badge: '',
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 14,
    desc: 'Liability coverage up to $750,000. $500 deductible applies for damage claims.',
    deductible: '$500',
    coverage: '$14/day',
    color: 'border-blue-400',
    badge: 'Most popular',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 24,
    desc: 'Full coverage with only a $0 deductible. Maximum protection for peace of mind.',
    deductible: '$0',
    coverage: '$24/day',
    color: 'border-green-400',
    badge: 'Best protection',
  },
]

function timeToHours(t: string): number {
  const [time, ampm] = t.split(' ')
  let [h, m] = time.split(':').map(Number)
  if (ampm === 'PM' && h !== 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  return h + m / 60
}

function fmtDate(dateStr: string, timeStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) + ' · ' + timeStr
}

export default function CheckoutForm({ car, userId, params }: {
  car: { id: string; name: string; rate_per_mile: number; image_url: string | null; location: string | null; included_miles_per_day?: number; host?: { full_name: string } | null }
  userId: string
  params: Record<string, string>
}) {
  const router = useRouter()
  const { startDate, endDate, startTime, endTime, delivery, deliveryAddress, phone, dl, notes } = params
  const includedPerDay = car.included_miles_per_day ?? 30
  const wantsDelivery = delivery === '1'

  const [insurance, setInsurance] = useState('standard')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { days, includedMiles, milesDeposit, insuranceCost, totalDeposit } = useMemo(() => {
    if (!startDate || !endDate) return { days: 0, includedMiles: 0, milesDeposit: 0, insuranceCost: 0, totalDeposit: 0 }
    const startH = timeToHours(startTime || '10:00 AM')
    const endH = timeToHours(endTime || '10:00 AM')
    const startMs = new Date(startDate + 'T00:00:00').getTime() + startH * 3600000
    const endMs = new Date(endDate + 'T00:00:00').getTime() + endH * 3600000
    const ms = endMs - startMs
    if (ms <= 0) return { days: 0, includedMiles: 0, milesDeposit: 0, insuranceCost: 0, totalDeposit: 0 }
    const d = Math.ceil(ms / (1000 * 60 * 60 * 24))
    const m = d * includedPerDay
    const mDep = m * car.rate_per_mile
    const plan = INSURANCE_PLANS.find(p => p.id === insurance)!
    const ins = plan.price * d
    return { days: d, includedMiles: m, milesDeposit: mDep, insuranceCost: ins, totalDeposit: mDep + ins + (wantsDelivery ? DELIVERY_FEE : 0) }
  }, [startDate, endDate, startTime, endTime, includedPerDay, car.rate_per_mile, insurance, wantsDelivery])

  async function handleBook() {
    setLoading(true); setError('')
    const supabase = createClient()
    const startH = timeToHours(startTime || '10:00 AM')
    const endH = timeToHours(endTime || '10:00 AM')
    const startISO = new Date(new Date(startDate + 'T00:00:00').getTime() + startH * 3600000).toISOString()
    const endISO = new Date(new Date(endDate + 'T00:00:00').getTime() + endH * 3600000).toISOString()
    const { error: err } = await supabase.from('bookings').insert({
      guest_id: userId, car_id: car.id, status: 'pending',
      start_date: startISO, end_date: endISO,
      rate_per_mile: car.rate_per_mile,
      delivery_requested: wantsDelivery,
      delivery_address: wantsDelivery ? deliveryAddress : null,
      pickup_location: wantsDelivery ? deliveryAddress : null,
      phone: phone || null, driver_license: dl || null, notes: notes || null,
      insurance_plan: insurance,
    })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/dashboard/bookings?booked=1')
  }

  if (!startDate || !endDate) {
    router.replace(`/cars/${car.id}/book`)
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

      {/* Left column */}
      <div className="space-y-6">

        {/* Trip details card */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Your trip</h2>
          </div>
          <div className="p-5 flex gap-4 items-start">
            {car.image_url
              ? <img src={car.image_url} alt={car.name} className="w-24 h-16 object-cover rounded-xl flex-shrink-0" />
              : <div className="w-24 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">🚗</div>
            }
            <div>
              <p className="font-bold text-gray-900">{car.name}</p>
              {car.host?.full_name && <p className="text-xs text-gray-400 mt-0.5">Hosted by {car.host.full_name}</p>}
              {car.location && <p className="text-xs text-gray-400 mt-0.5">📍 {car.location}</p>}
            </div>
          </div>
          <div className="border-t border-gray-100 grid grid-cols-2 divide-x divide-gray-100">
            <div className="px-5 py-4">
              <p className="text-xs text-gray-400 font-medium mb-1">PICKUP</p>
              <p className="text-sm font-semibold text-gray-900">{fmtDate(startDate, startTime || '10:00 AM')}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-gray-400 font-medium mb-1">RETURN</p>
              <p className="text-sm font-semibold text-gray-900">{fmtDate(endDate, endTime || '10:00 AM')}</p>
            </div>
          </div>
          {wantsDelivery && (
            <div className="border-t border-gray-100 px-5 py-3 flex gap-2 text-sm">
              <span className="text-blue-500">🚗</span>
              <span className="text-gray-600">Delivery to: <span className="font-medium text-gray-900">{deliveryAddress}</span></span>
            </div>
          )}
        </div>

        {/* Insurance */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Protection plan</h2>
            <p className="text-xs text-gray-400 mt-0.5">Choose the coverage level that works for you</p>
          </div>
          <div className="p-5 space-y-3">
            {INSURANCE_PLANS.map(plan => (
              <label key={plan.id}
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${insurance === plan.id ? plan.color + ' bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <input type="radio" name="insurance" value={plan.id} checked={insurance === plan.id}
                  onChange={() => setInsurance(plan.id)} className="mt-1 accent-gray-900" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{plan.name}</span>
                    {plan.badge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plan.id === 'standard' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                        {plan.badge}
                      </span>
                    )}
                    <span className="ml-auto text-sm font-semibold text-gray-700">
                      {plan.price === 0 ? 'Free' : `+$${plan.price}/day`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{plan.desc}</p>
                  <p className="text-xs text-gray-400 mt-1">Deductible: <span className="font-medium text-gray-700">{plan.deductible}</span></p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Payment method */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Payment method</h2>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
              <div className="w-10 h-7 bg-gray-900 rounded-md flex items-center justify-center">
                <svg viewBox="0 0 32 20" className="w-6" fill="none">
                  <rect width="32" height="20" rx="3" fill="#1a1a1a"/>
                  <circle cx="12" cy="10" r="6" fill="#e53935" fillOpacity=".9"/>
                  <circle cx="20" cy="10" r="6" fill="#ffb300" fillOpacity=".9"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">•••• •••• •••• 4242</p>
                <p className="text-xs text-gray-400">Visa · Expires 12/27</p>
              </div>
              <span className="ml-auto text-xs text-blue-500 font-medium cursor-pointer">Change</span>
            </div>
            <p className="text-xs text-gray-400 mt-2.5">Payment processing coming soon — your booking is confirmed immediately.</p>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}
      </div>

      {/* Right: price summary + book button */}
      <div className="lg:sticky lg:top-24 space-y-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">Price breakdown</h2>
          <div className="space-y-2 text-sm">
            <Row label={`${days} day${days !== 1 ? 's' : ''} · ${includedPerDay} mi/day`} value={`${includedMiles} mi`} />
            <Row label={`Miles deposit @ $${car.rate_per_mile}/mi`} value={`$${milesDeposit.toFixed(2)}`} />
            {insuranceCost > 0 && (
              <Row label={`${INSURANCE_PLANS.find(p => p.id === insurance)?.name} protection`} value={`$${insuranceCost.toFixed(2)}`} />
            )}
            {wantsDelivery && <Row label="Delivery fee" value={`$${DELIVERY_FEE}.00`} />}
          </div>
          <div className="border-t border-gray-100 pt-3">
            <Row label="Total due now" value={`$${totalDeposit.toFixed(2)}`} bold />
          </div>
          <p className="text-xs text-gray-400">Extra miles beyond included are charged at ${car.rate_per_mile}/mi after the trip ends.</p>
        </div>

        <button onClick={handleBook} disabled={loading}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${loading ? 'bg-green-500 text-white scale-[1.01]' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}>
          {loading ? '🎉 Booking your trip…' : '🚗 Book & Joy!'}
        </button>

        <p className="text-xs text-center text-gray-400">Free cancellation within 24 hours of booking</p>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? 'font-semibold text-gray-800' : 'text-gray-500'}>{label}</span>
      <span className={bold ? 'font-bold text-gray-900 text-base' : 'font-medium text-gray-800'}>{value}</span>
    </div>
  )
}
