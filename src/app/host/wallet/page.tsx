export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const typeStyle: Record<string, string> = {
  earning: 'text-green-600',
  topup:   'text-green-600',
  payout:  'text-red-500',
  refund:  'text-blue-500',
}

const typeLabel: Record<string, string> = {
  earning: '+ Earning',
  topup:   '+ Top-up',
  payout:  '− Payout',
  refund:  '+ Refund',
}

export default async function HostWalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'host') redirect('/dashboard')

  const { data: wallet } = await adminClient.from('wallets').select('*').eq('user_id', user.id).single()
  const { data: txns } = wallet ? await adminClient
    .from('wallet_transactions')
    .select('*')
    .eq('wallet_id', wallet.id)
    .order('created_at', { ascending: false })
    .limit(50) : { data: [] }

  const balance = wallet?.balance ?? 0
  const totalEarned = txns?.filter((t: any) => t.type === 'earning').reduce((s: number, t: any) => s + t.amount, 0) ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Host Wallet</h1>
            <p className="text-gray-400 text-sm mt-0.5">Your earnings from rentals</p>
          </div>
          <Link href="/host" className="text-sm text-gray-400 hover:text-gray-700 transition">← Dashboard</Link>
        </div>

        {/* Balance + stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-900 text-white rounded-2xl p-6 col-span-2">
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Available Balance</p>
            <p className="text-5xl font-bold">${balance.toFixed(2)}</p>
            <p className="text-gray-400 text-sm mt-3">Total earned: <span className="text-green-400 font-semibold">${totalEarned.toFixed(2)}</span></p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-700">
          Earnings are credited after each booking (90% of trip value — 10% platform fee). Payout to bank coming soon.
        </div>

        {/* Transactions */}
        <h2 className="text-base font-semibold text-gray-900 mb-3">Transaction History</h2>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm divide-y divide-gray-100">
          {(!txns || txns.length === 0) ? (
            <p className="text-gray-400 text-sm text-center py-10">No transactions yet. Earnings appear after guests complete bookings.</p>
          ) : txns.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{t.description ?? t.type}</p>
                <p className="text-xs text-gray-400 mt-0.5">{fmtDate(t.created_at)}</p>
              </div>
              <span className={`font-bold text-sm ${typeStyle[t.type] ?? 'text-gray-600'}`}>
                {typeLabel[t.type] ?? ''} ${Math.abs(t.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
