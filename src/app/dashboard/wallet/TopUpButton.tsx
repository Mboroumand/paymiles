'use client'
import { useState } from 'react'

const AMOUNTS = [20, 50, 100, 200]

export default function TopUpButton() {
  const [loading, setLoading] = useState(false)
  const [custom, setCustom] = useState('')
  const [selected, setSelected] = useState(50)
  const [error, setError] = useState('')

  async function handleTopUp() {
    const amount = custom ? parseFloat(custom) : selected
    if (!amount || amount < 5) { setError('Minimum top-up is $5'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/wallet/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    })
    const data = await res.json()
    if (!res.ok || !data.url) { setError(data.error ?? 'Failed'); setLoading(false); return }
    window.location.href = data.url
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {AMOUNTS.map(a => (
          <button key={a} onClick={() => { setSelected(a); setCustom('') }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${selected === a && !custom ? 'bg-white text-gray-900' : 'bg-white/10 text-white hover:bg-white/20'}`}>
            ${a}
          </button>
        ))}
        <input
          type="number" placeholder="Custom" value={custom}
          onChange={e => setCustom(e.target.value)}
          className="w-24 px-3 py-1.5 rounded-lg bg-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:bg-white/20"
        />
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button onClick={handleTopUp} disabled={loading}
        className="w-full bg-white text-gray-900 font-semibold py-2.5 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition text-sm">
        {loading ? 'Redirecting…' : `Add $${custom || selected} to Wallet`}
      </button>
    </div>
  )
}
