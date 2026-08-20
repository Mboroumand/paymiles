'use client'
import { useState } from 'react'
import Link from 'next/link'

interface Car {
  id: string
  name: string
  rate_per_mile: number
  location?: string | null
  included_miles_per_day?: number | null
}

export default function BookingSidebar({ car, isLoggedIn, dlStatus }: { car: Car; isLoggedIn: boolean; dlStatus?: string }) {
  const [days, setDays] = useState(3)
  const [wantsDelivery, setWantsDelivery] = useState(false)

  const includedPerDay = car.included_miles_per_day ?? 30
  const includedMiles = days * includedPerDay
  const milesDeposit = includedMiles * car.rate_per_mile
  const depositAmount = milesDeposit + (wantsDelivery ? 99 : 0)

  const bookHref = wantsDelivery ? `/cars/${car.id}/book?delivery=1` : `/cars/${car.id}/book`

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6">
      {/* Rate */}
      <div className="mb-5">
        <span className="text-3xl font-bold text-gray-900">${car.rate_per_mile}</span>
        <span className="text-gray-400 text-base ml-1">/ mile</span>
        <p className="text-xs text-gray-400 mt-1">{includedPerDay} miles included per day</p>
      </div>

      {/* Pickup location */}
      {car.location && (
        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 flex items-center gap-2.5 text-sm">
          <span className="text-base">📍</span>
          <div>
            <p className="font-medium text-gray-800 leading-tight">{car.location}</p>
            <p className="text-gray-400 text-xs">Default pickup location</p>
          </div>
        </div>
      )}

      {/* Delivery toggle */}
      <div
        className={`rounded-xl border px-4 py-3 mb-5 cursor-pointer transition-all ${wantsDelivery ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
        onClick={() => setWantsDelivery(v => !v)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-base">🚗</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Request delivery</p>
              <p className="text-gray-400 text-xs">Car brought to your address</p>
            </div>
          </div>
          <div className={`relative w-10 h-5 rounded-full transition-colors ${wantsDelivery ? 'bg-gray-900' : 'bg-gray-200'}`}>
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${wantsDelivery ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </div>
      </div>

      {/* Trip estimator */}
      <div className="bg-gray-50 rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-700">Estimate your trip</label>
          <span className="text-sm text-gray-500">{days} day{days !== 1 ? 's' : ''}</span>
        </div>
        <input
          type="range" min={1} max={30} step={1} value={days}
          onChange={e => setDays(Number(e.target.value))}
          className="w-full accent-gray-900 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1 mb-3">
          <span>1 day</span>
          <span>30 days</span>
        </div>

        {/* Breakdown */}
        <div className="space-y-1.5 text-sm border-t border-gray-200 pt-3">
          <div className="flex justify-between text-gray-500">
            <span>Included miles ({includedPerDay}/day × {days}d)</span>
            <span className="font-medium text-gray-700">{includedMiles} mi</span>
          </div>
          {wantsDelivery && (
            <div className="flex justify-between text-gray-500">
              <span>Delivery fee</span>
              <span className="font-medium text-gray-700">$99.00</span>
            </div>
          )}
          <div className="flex justify-between text-gray-500 border-t border-gray-200 pt-1.5">
            <span>Total due at booking</span>
            <span className="font-bold text-gray-900">${depositAmount.toFixed(0)}</span>
          </div>
          <p className="text-xs text-gray-400 pt-1">Extra miles billed at ${car.rate_per_mile}/mi after trip</p>
        </div>
      </div>

      {/* CTA */}
      {isLoggedIn && dlStatus === 'approved' ? (
        <Link href={bookHref}
          className="block w-full text-center bg-gray-900 hover:bg-gray-800 text-white py-3.5 rounded-xl font-semibold transition">
          {wantsDelivery ? 'Request delivery & book' : 'Book this car'}
        </Link>
      ) : isLoggedIn && dlStatus === 'pending' ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3.5 text-center">
          <p className="text-yellow-700 text-sm font-medium">⏳ License under review</p>
          <p className="text-yellow-500 text-xs mt-0.5">You'll be able to book once approved (usually within 24h)</p>
        </div>
      ) : isLoggedIn ? (
        <Link href="/dashboard/profile"
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold transition">
          Verify license to book →
        </Link>
      ) : (
        <div className="space-y-2">
          <Link href="/auth/login"
            className="block w-full text-center bg-gray-900 hover:bg-gray-800 text-white py-3.5 rounded-xl font-semibold transition">
            Log in to book
          </Link>
          <Link href="/auth/register"
            className="block w-full text-center border border-gray-200 hover:border-gray-300 text-gray-700 py-3 rounded-xl text-sm font-medium transition">
            Create account
          </Link>
        </div>
      )}

      {/* Trust signals */}
      <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
        {[
          { icon: '✓', text: `${includedPerDay} miles/day guaranteed for host` },
          { icon: '✓', text: 'Deposit held, extra miles charged after trip' },
          { icon: '✓', text: 'Odometer tracked via Tesla API' },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-xs text-gray-500">
            <span className="text-green-500 font-bold">{icon}</span>
            {text}
          </div>
        ))}
      </div>
    </div>
  )
}
