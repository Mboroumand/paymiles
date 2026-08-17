export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import CarEditTabs, { NavLink } from './CarEditTabs'

export default async function CarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'host' && profile?.role !== 'admin') redirect('/dashboard')

  const { data: car } = await adminClient.from('cars').select('*').eq('id', id).single()
  if (!car) notFound()
  if (profile?.role !== 'admin' && car.host_id !== user.id) notFound()

  const [{ count }, { data: photos }] = await Promise.all([
    adminClient.from('bookings').select('*', { count: 'exact', head: true }).eq('car_id', id),
    adminClient.from('car_photos').select('*').eq('car_id', id).order('created_at'),
  ])

  const statusStyle: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-600 border-red-200',
  }

  return (
    <div className="flex gap-0 min-h-screen">
      {/* Left panel — car card + nav */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200 p-5 sticky top-0 h-screen overflow-y-auto">
        <Link href="/host/fleet" className="text-gray-500 hover:text-gray-900 text-xs flex items-center gap-1 mb-5 transition">
          ← Fleet
        </Link>

        {/* Car photo */}
        <div className="relative rounded-xl overflow-hidden mb-4">
          {car.image_url ? (
            <img src={car.image_url} alt={car.name} className="w-full h-36 object-cover" />
          ) : (
            <div className="w-full h-36 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">No photo</div>
          )}
          <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full border font-medium ${statusStyle[car.listing_status] ?? ''}`}>
            {car.listing_status === 'approved' ? 'Listed' : car.listing_status}
          </span>
        </div>

        <p className="font-bold text-sm">{car.name}</p>
        <p className="text-gray-400 text-xs mt-0.5">{car.year}{car.color ? ` · ${car.color}` : ''}</p>
        {car.license_plate && <p className="text-gray-500 text-xs">{car.license_plate}</p>}
        <p className="text-gray-500 text-xs mt-1">Trips: {count ?? 0}</p>

        {/* Nav */}
        <nav className="mt-6 space-y-0.5">
          {[
            { tab: 'pricing', label: 'Pricing' },
            { tab: 'photos', label: 'Photos' },
            { tab: 'details', label: 'Details' },
            { tab: 'availability', label: 'Availability' },
          ].map(({ tab, label }) => (
            <NavLink key={tab} tab={tab} label={label} carId={id} />
          ))}
        </nav>
      </div>

      {/* Right content */}
      <div className="flex-1 p-8 max-w-2xl">
        <CarEditTabs car={car} hostId={user.id} photos={photos ?? []} />
      </div>
    </div>
  )
}
