export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function fmtUSD(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default async function AdminWalletPage() {
  // All earning transactions across all host wallets
  const { data: earningTxns } = await adminClient
    .from('wallet_transactions')
    .select('id, amount, description, created_at, wallet_id, reference_id')
    .eq('type', 'earning')
    .order('created_at', { ascending: false })
    .limit(100)

  // All wallets for joining host info
  const walletIds = [...new Set((earningTxns ?? []).map((t: any) => t.wallet_id))]
  const { data: wallets } = walletIds.length > 0
    ? await adminClient.from('wallets').select('id, user_id').in('id', walletIds)
    : { data: [] }

  const { data: profiles } = walletIds.length > 0
    ? await adminClient.from('profiles').select('id, full_name, email')
        .in('id', (wallets ?? []).map((w: any) => w.user_id))
    : { data: [] }

  const walletMap = Object.fromEntries((wallets ?? []).map((w: any) => [w.id, w.user_id]))
  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]))

  // Metrics
  const totalHostEarnings = (earningTxns ?? []).reduce((s: number, t: any) => s + t.amount, 0)
  // host received 75%, so gross = host / 0.75, platform = gross * 0.25 = host / 3
  const totalGross = totalHostEarnings / 0.75
  const totalPlatformRevenue = totalGross * 0.25
  const bookingCount = (earningTxns ?? []).length

  // Top hosts by earnings
  const hostTotals: Record<string, number> = {}
  for (const t of earningTxns ?? []) {
    const uid = walletMap[t.wallet_id]
    if (uid) hostTotals[uid] = (hostTotals[uid] ?? 0) + t.amount
  }
  const topHosts = Object.entries(hostTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Platform Revenue</h1>
        <p className="text-gray-400 text-sm mt-1">25% of every booking goes to Paymiles</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 text-white rounded-2xl p-6 col-span-2">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Platform Revenue (25%)</p>
          <p className="text-4xl font-black">{fmtUSD(totalPlatformRevenue)}</p>
          <p className="text-gray-400 text-xs mt-2">from {bookingCount} bookings</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Gross</p>
          <p className="text-2xl font-bold text-gray-900">{fmtUSD(totalGross)}</p>
          <p className="text-gray-400 text-xs mt-2">all bookings combined</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Paid to Hosts (75%)</p>
          <p className="text-2xl font-bold text-gray-900">{fmtUSD(totalHostEarnings)}</p>
          <p className="text-gray-400 text-xs mt-2">credited to host wallets</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent transactions */}
        <div className="col-span-2">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Recent Booking Earnings</h2>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm divide-y divide-gray-100">
            {(!earningTxns || earningTxns.length === 0) ? (
              <p className="text-gray-400 text-sm text-center py-12">No bookings processed yet.</p>
            ) : earningTxns.slice(0, 20).map((t: any) => {
              const uid = walletMap[t.wallet_id]
              const profile = uid ? profileMap[uid] : null
              const gross = parseFloat((t.amount / 0.75).toFixed(2))
              const fee = parseFloat((gross * 0.25).toFixed(2))
              return (
                <div key={t.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {profile?.full_name ?? profile?.email ?? 'Unknown host'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{fmtDate(t.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm font-bold text-gray-900">Gross {fmtUSD(gross)}</p>
                    <p className="text-xs text-green-600 font-semibold">+{fmtUSD(fee)} fee</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top hosts */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Top Hosts by Earnings</h2>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm divide-y divide-gray-100">
            {topHosts.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No data yet.</p>
            ) : topHosts.map(([uid, hostTotal]) => {
              const profile = profileMap[uid]
              const grossForHost = hostTotal / 0.75
              const feeFromHost = grossForHost * 0.25
              return (
                <div key={uid} className="px-4 py-4">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {profile?.full_name ?? profile?.email ?? uid.slice(0, 8) + '…'}
                  </p>
                  <div className="flex justify-between mt-1.5 text-xs">
                    <span className="text-gray-400">Host earned</span>
                    <span className="font-medium text-gray-700">{fmtUSD(hostTotal)}</span>
                  </div>
                  <div className="flex justify-between mt-0.5 text-xs">
                    <span className="text-gray-400">Platform fee</span>
                    <span className="font-semibold text-green-600">{fmtUSD(feeFromHost)}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 leading-relaxed">
            <strong>Fee structure:</strong> Paymiles keeps 25% of every booking total. Hosts receive 75%, credited automatically to their wallets when payment clears.
          </div>
        </div>
      </div>
    </div>
  )
}
