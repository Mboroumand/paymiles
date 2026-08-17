import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import SubmitCarForm from './SubmitCarForm'
import Link from 'next/link'

export default async function SubmitCarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'host' && profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="p-8 max-w-xl">
      <Link href="/host/fleet" className="text-gray-500 hover:text-gray-900 text-sm flex items-center gap-1.5 mb-6 transition">
        ← Back to Fleet
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">List a car</h1>
      <p className="text-gray-500 text-sm mb-8">Your car will be reviewed by an admin before going live.</p>
      <SubmitCarForm hostId={user.id} />
    </div>
  )
}
