'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', license: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.name } }
    })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-3xl font-bold">⚡ Paymiles</span>
          <p className="text-gray-400 mt-2">Create your account</p>
        </div>
        <form onSubmit={handleRegister} className="bg-gray-900 border border-white/10 rounded-2xl p-8 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>}
          {[
            { label: 'Full Name', key: 'name', type: 'text' },
            { label: 'Email', key: 'email', type: 'email' },
            { label: 'Password', key: 'password', type: 'password' },
            { label: "Driver's License #", key: 'license', type: 'text' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
              <input
                type={type} value={form[key as keyof typeof form]} onChange={update(key)} required
                className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          ))}
          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
          <p className="text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-400 hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
