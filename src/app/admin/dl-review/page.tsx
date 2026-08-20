export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ApproveButtons from './ApproveButtons'

async function signedUrl(path: string | null) {
  if (!path) return null
  const { data } = await adminClient.storage.from('dl-photos').createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}

export default async function DLReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: me } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') redirect('/')

  const { data: submissions } = await adminClient
    .from('profiles')
    .select('id, full_name, email, dl_number, dl_expiry, dl_status, dl_front_url, dl_back_url, created_at')
    .in('dl_status', ['pending', 'approved', 'rejected'])
    .order('created_at', { ascending: false })

  const rows = await Promise.all((submissions ?? []).map(async p => ({
    ...p,
    frontSigned: await signedUrl(p.dl_front_url),
    backSigned: await signedUrl(p.dl_back_url),
  })))

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Driver's License Review</h1>
      <p className="text-gray-400 text-sm mb-8">Approve or reject guest DL submissions before they can book cars.</p>

      {rows.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400">
          No submissions yet.
        </div>
      )}

      <div className="space-y-6">
        {rows.map(p => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between gap-6 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900 text-lg">{p.full_name ?? '—'}</p>
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

            {/* License photos */}
            {(p.frontSigned || p.backSigned) && (
              <div className="grid grid-cols-2 gap-4">
                {p.frontSigned && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Front</p>
                    <a href={p.frontSigned} target="_blank" rel="noreferrer">
                      <img src={p.frontSigned} alt="DL Front" className="w-full h-48 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition" />
                    </a>
                  </div>
                )}
                {p.backSigned && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Back</p>
                    <a href={p.backSigned} target="_blank" rel="noreferrer">
                      <img src={p.backSigned} alt="DL Back" className="w-full h-48 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition" />
                    </a>
                  </div>
                )}
              </div>
            )}
            {!p.frontSigned && !p.backSigned && (
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-400">No photos uploaded</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
