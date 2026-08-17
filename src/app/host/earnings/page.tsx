export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export default async function HostEarningsPage() {
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
        .select('*, car:cars(name, model, rate_per_mile)')
        .in('car_id', carIds)
        .eq('status', 'completed')
        .order('end_date', { ascending: false })
    : { data: [] }

  const totalEarnings = (trips ?? []).reduce((s, t) => s + (t.total_amount ?? 0), 0)
  const totalMiles = (trips ?? []).reduce((s, t) => s + (t.miles_driven ?? 0), 0)
  const tripCount = trips?.length ?? 0

  const byMonth: Record<string, { earnings: number; miles: number; count: number }> = {}
  for (const trip of trips ?? []) {
    if (!trip.end_date) continue
    const key = trip.end_date.slice(0, 7)
    if (!byMonth[key]) byMonth[key] = { earnings: 0, miles: 0, count: 0 }
    byMonth[key].earnings += trip.total_amount ?? 0
    byMonth[key].miles += trip.miles_driven ?? 0
    byMonth[key].count++
  }
  const months = Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6)

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Earnings</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Total Earned', value: `$${totalEarnings.toFixed(2)}`, icon: '💰', color: 'text-green-600' },
          { label: 'Total Miles', value: totalMiles.toFixed(0), icon: '📍', color: 'text-blue-600' },
          { label: 'Completed Trips', value: tripCount, icon: '✅', color: 'text-gray-900' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <span className="text-2xl">{s.icon}</span>
            <p className="text-gray-400 text-xs mt-3 font-medium uppercase tracking-wider">{s.label}</p>
            <p className={`text-3xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly breakdown */}
      {months.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Monthly Breakdown</h2>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {months.map(([month, data], i) => {
              const date = new Date(month + '-01')
              const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              return (
                <div key={month} className={`flex items-center justify-between px-6 py-4 ${i !== 0 ? 'border-t border-gray-100' : ''}`}>
                  <div>
                    <p className="font-semibold text-gray-900">{label}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{data.count} trip{data.count !== 1 ? 's' : ''} · {data.miles.toFixed(0)} miles</p>
                  </div>
                  <p className="text-green-600 font-bold text-lg">${data.earnings.toFixed(2)}</p>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center text-gray-400 shadow-sm mb-8">
          No completed trips yet
        </div>
      )}

      {/* Transaction history */}
      {trips && trips.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Transaction History</h2>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {trips.map((trip, i) => (
              <div key={trip.id} className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition ${i !== 0 ? 'border-t border-gray-100' : ''}`}>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{trip.car?.name ?? '—'}</p>
                  <p className="text-gray-400 text-xs">{trip.end_date ? new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-sm">{(trip.miles_driven ?? 0).toFixed(1)} mi × ${trip.car?.rate_per_mile ?? '—'}/mi</p>
                  <p className="text-green-600 font-bold">${(trip.total_amount ?? 0).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
