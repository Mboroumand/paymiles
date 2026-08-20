export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ProfileForm from './ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await adminClient
    .from('profiles').select('*').eq('id', user.id).single()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="guest" />
      <div className="max-w-xl mx-auto px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-400 text-sm mt-0.5">Required before booking</p>
          </div>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-700 transition">← Dashboard</Link>
        </div>

        {/* DL status banner */}
        {profile?.dl_status === 'approved' && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-2 text-green-700 text-sm font-medium">
            ✅ Driver's license verified — you can book cars
          </div>
        )}
        {profile?.dl_status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-2 text-yellow-700 text-sm font-medium">
            ⏳ License submitted — pending admin review (usually within 24h)
          </div>
        )}
        {profile?.dl_status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-2 text-red-700 text-sm font-medium">
            ❌ License rejected — please re-submit with correct information
          </div>
        )}
        {(!profile?.dl_status || profile?.dl_status === 'none') && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-blue-700 text-sm">
            📋 Submit your driver's license to unlock car bookings.
          </div>
        )}

        <ProfileForm profile={profile} userId={user.id} email={user.email ?? ''} />
      </div>
    </div>
  )
}
