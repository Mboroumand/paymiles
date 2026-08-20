export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import TopUpButton from './TopUpButton'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const typeStyle: Record<string, string> = {
  topup:   'text-green-600',
  earning: 'text-green-600',
  payment: 'text-red-500',
  payout:  'text-red-500',
  refund:  'text-blue-500',
}

const typeLabel: Record<string, string> = {
  topup:   '+ Top-up',
  earning: '+ Earning',
  payment: '− Payment',
  payout:  '− Payout',
  refund:  '+ Refund',
}

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: wallet } = await adminClient
    .from('wallets').select('*').eq('user_id', user.id).single()

  const { data: txns } = wallet ? await adminClient
    .from('wallet_transactions')
    .select('*')
    .eq('wallet_id', wallet.id)
    .order('created_at', { ascending: false })
    .limit(50) : { data: [] }

  const balance = wallet?.balance ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="guest" />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
            <p className="text-gray-400 text-sm mt-0.5">Credits for bookings</p>
          </div>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-700 transition">← Dashboard</Link>
        </div>

        {/* Balance card */}
        <div className="bg-gray-900 text-white rounded-2xl p-8 mb-6 shadow-lg">
          <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Available Balance</p>
          <p className="text-5xl font-bold">${balance.toFixed(2)}</p>
          <div className="mt-6">
            <TopUpButton />
          </div>
        </div>

        {/* Transactions */}
        <h2 className="text-base font-semibold text-gray-900 mb-3">Transaction History</h2>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm divide-y divide-gray-100">
          {(!txns || txns.length === 0) ? (
            <p className="text-gray-400 text-sm text-center py-10">No transactions yet.</p>
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
