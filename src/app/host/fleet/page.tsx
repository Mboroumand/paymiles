export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HostFleetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'host' && profile?.role !== 'admin') redirect('/dashboard')

  const { data: cars } = await adminClient.from('cars').select('*').eq('host_id', user.id).order('created_at', { ascending: false })

  const listingBadge: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-600 border-red-200',
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet</h1>
          <p className="text-gray-400 text-sm mt-0.5">{cars?.length ?? 0} vehicle{(cars?.length ?? 0) !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/host/cars/submit"
          className="bg-gray-900 text-white font-semibold px-4 py-2 rounded-xl text-sm hover:bg-gray-800 transition">
          + List a car
        </Link>
      </div>

      {!cars?.length ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center shadow-sm">
          <div className="text-4xl mb-3">🚗</div>
          <p className="text-gray-700 font-semibold text-lg">No cars listed yet</p>
          <p className="text-gray-400 text-sm mt-2">Submit your Tesla to start earning per mile</p>
          <Link href="/host/cars/submit"
            className="inline-block mt-5 bg-gray-900 text-white font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition">
            List your first car
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cars.map(car => (
            <Link key={car.id} href={`/host/fleet/${car.id}`}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-md transition-all group block">
              <div className="relative">
                {car.image_url ? (
                  <img src={car.image_url} alt={car.name} className="w-full h-48 object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-4xl">🚗</div>
                )}
                <span className={`absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full border font-medium ${listingBadge[car.listing_status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {car.listing_status === 'approved' ? 'Listed' : car.listing_status}
                </span>
                {car.listing_status === 'approved' && (
                  <span className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-medium ${(car.is_active ?? true) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {(car.is_active ?? true) ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <p className="font-semibold text-gray-900">{car.name}</p>
                  <span className="text-blue-600 font-bold text-sm">${car.rate_per_mile}/mi</span>
                </div>
                <p className="text-gray-400 text-sm">{car.year}{car.color ? ` · ${car.color}` : ''}</p>
                {car.location && <p className="text-gray-400 text-xs mt-1.5 flex items-center gap-1">📍 {car.location}</p>}

                {car.listing_status === 'pending' && (
                  <p className="mt-3 text-amber-600 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Awaiting admin review
                  </p>
                )}
                {car.listing_status === 'rejected' && (
                  <p className="mt-3 text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    Not approved — contact support
                  </p>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  {car.license_plate && <span>{car.license_plate}</span>}
                  {car.odometer_start != null && <span>{car.odometer_start.toLocaleString()} mi start</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
