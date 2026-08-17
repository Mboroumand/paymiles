export const dynamic = 'force-dynamic'
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SelectTeslaClient from './SelectTeslaClient'

export default async function SelectTeslaPage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ vehicles?: string }>
}) {
  const { id } = await params
  const { vehicles } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const parsed = vehicles ? JSON.parse(decodeURIComponent(vehicles)) : []

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 w-full max-w-md">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Select your Tesla</h1>
        <p className="text-gray-500 text-sm mb-6">Choose which vehicle to link to this car listing.</p>
        <SelectTeslaClient carId={id} vehicles={parsed} />
      </div>
    </div>
  )
}
