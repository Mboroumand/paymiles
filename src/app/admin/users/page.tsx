import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PromoteButton from './PromoteButton'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen">
      <Navbar role="admin" />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-8">Users ({users?.length ?? 0})</h1>

        <div className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-gray-400">
              <tr>
                {['Name', 'Email', 'Role', 'License', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users?.map(u => (
                <tr key={u.id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3 font-medium">{u.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      u.role === 'admin'
                        ? 'bg-purple-600/20 text-purple-400 border-purple-500/30'
                        : 'bg-gray-600/20 text-gray-400 border-gray-500/30'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{u.driver_license ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {u.id !== user.id && (
                      <PromoteButton userId={u.id} currentRole={u.role} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
