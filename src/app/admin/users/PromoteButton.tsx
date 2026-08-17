'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PromoteButton({ userId, currentRole }: { userId: string; currentRole: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function setRole(newRole: string) {
    if (!confirm(`Change role to ${newRole}?`)) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex gap-2">
      {currentRole !== 'admin' && (
        <button onClick={() => setRole('admin')} disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 disabled:opacity-40 transition">
          {loading ? '…' : 'Make Admin'}
        </button>
      )}
      {currentRole !== 'host' && (
        <button onClick={() => setRole('host')} disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 disabled:opacity-40 transition">
          {loading ? '…' : 'Make Host'}
        </button>
      )}
      {currentRole !== 'guest' && (
        <button onClick={() => setRole('guest')} disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg bg-gray-600/20 text-gray-400 border border-gray-500/30 hover:bg-gray-600/30 disabled:opacity-40 transition">
          {loading ? '…' : 'Demote to Guest'}
        </button>
      )}
    </div>
  )
}
