import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import SubmitCarForm from './SubmitCarForm'

export default async function SubmitCarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'host' && profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="min-h-screen">
      <Navbar role="host" />
      <div className="max-w-xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Submit Your Car</h1>
        <p className="text-gray-400 mb-8">Your car will be reviewed by an admin before going live on the platform.</p>
        <SubmitCarForm hostId={user.id} />
      </div>
    </div>
  )
}
