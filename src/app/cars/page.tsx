import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Car } from '@/lib/types'

export default async function CarsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role: string | undefined
  if (user) {
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    role = data?.role
  }

  const { data: cars } = await supabase
    .from('cars')
    .select('*')
    .eq('status', 'available')
    .eq('listing_status', 'approved')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role={role} />

      {/* Hero banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Browse Tesla rentals</h1>
          <p className="text-gray-500">Pay only for the miles you drive — no daily rates, no surprises.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {(!cars || cars.length === 0) ? (
          <div className="text-center py-24 text-gray-400">No cars available right now. Check back soon.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(cars as Car[]).map(car => (
              <Link key={car.id} href={`/cars/${car.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">

                {/* Photo */}
                <div className="aspect-[16/10] overflow-hidden bg-gray-100 relative">
                  {car.image_url ? (
                    <img src={car.image_url} alt={car.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">🚗</div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                      ⚡ Electric
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h2 className="font-bold text-gray-900 text-base">{car.name}</h2>
                      <p className="text-gray-400 text-sm">{car.year}{car.color ? ` · ${car.color}` : ''}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-gray-900 font-bold text-lg">${car.rate_per_mile}</span>
                      <span className="text-gray-400 text-xs"> /mile</span>
                    </div>
                  </div>

                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
                    <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">5 seats</span>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">Autopilot</span>
                    {car.tesla_vehicle_id && (
                      <span className="bg-blue-50 text-blue-600 text-xs px-2.5 py-1 rounded-full">Live data</span>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100 text-xs text-gray-400">
                    Pay only for miles driven
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
