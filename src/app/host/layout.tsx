import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import HostSidebar from './HostSidebar'

export default async function HostLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await adminClient.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (profile?.role !== 'host' && profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <HostSidebar />
      <div className="flex-1 ml-[72px]">
        {children}
      </div>
    </div>
  )
}
