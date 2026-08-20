export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ApproveButtons from './ApproveButtons'

export default async function DLReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: me } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') redirect('/')

  const { data: pending } = await adminClient
    .from('profiles')
    .select('id, full_name, email, dl_number, dl_expiry, dl_status, created_at')
    .in('dl_status', ['pending', 'approved', 'rejected'])
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Driver's License Review</h1>
      <p className="text-gray-400 text-sm mb-8">Approve or reject guest DL submissions before they can book cars.</p>

      {(!pending || pending.length === 0) && (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400">
          No pending submissions.
        </div>
      )}

      <div className="space-y-4">
        {pending?.map(p => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-gray-900">{p.full_name ?? '—'}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                  p.dl_status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                  p.dl_status === 'rejected' ? 'bg-red-100 text-red-600 border-red-200' :
                  'bg-yellow-100 text-yellow-700 border-yellow-200'
                }`}>{p.dl_status}</span>
              </div>
              <p className="text-gray-400 text-sm">{p.email}</p>
              <div className="flex gap-6 mt-3 text-sm">
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide">DL Number</span>
                  <p className="font-mono font-semibold text-gray-900">{p.dl_number ?? '—'}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Expiry</span>
                  <p className="font-semibold text-gray-900">
                    {p.dl_expiry ? new Date(p.dl_expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Submitted</span>
                  <p className="text-gray-600">{p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</p>
                </div>
              </div>
            </div>
            <ApproveButtons userId={p.id} currentStatus={p.dl_status} />
          </div>
        ))}
      </div>
    </div>
  )
}
