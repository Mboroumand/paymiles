export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PromoteButton from './PromoteButton'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: users } = await adminClient.from('profiles').select('*').order('created_at', { ascending: false })

  const roleStyle: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    host: 'bg-blue-100 text-blue-700 border-blue-200',
    guest: 'bg-gray-100 text-gray-600 border-gray-200',
  }

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Users</h1>
      <p className="text-gray-500 text-sm mb-8">{users?.length ?? 0} accounts</p>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
          <span>Name</span><span>Email</span><span>Role</span><span>Joined</span><span>Actions</span>
        </div>

        {users?.map((u, i) => (
          <div key={u.id}
            className={`grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 px-5 py-4 items-center hover:bg-gray-50 transition ${i !== 0 ? 'border-t border-gray-100' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                {(u.full_name ?? u.email ?? '?')[0].toUpperCase()}
              </div>
              <span className="text-gray-900 text-sm font-medium truncate">{u.full_name ?? '—'}</span>
            </div>
            <span className="text-gray-500 text-sm truncate">{u.email}</span>
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium w-fit ${roleStyle[u.role] ?? roleStyle.guest}`}>
              {u.role}
            </span>
            <span className="text-gray-400 text-sm">
              {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <div>
              {u.id !== user.id && <PromoteButton userId={u.id} currentRole={u.role} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
