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
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen">
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Available Cars</h1>
        <p className="text-gray-400 mb-8">All Tesla vehicles, priced per mile driven</p>

        {(!cars || cars.length === 0) ? (
          <div className="text-center py-24 text-gray-500">No cars available right now.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(cars as Car[]).map(car => (
              <div key={car.id} className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/40 transition">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 h-48 flex items-center justify-center">
                  {car.image_url ? (
                    <img src={car.image_url} alt={car.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-6xl">🚗</span>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h2 className="text-xl font-semibold">{car.name}</h2>
                      <p className="text-gray-400 text-sm">{car.year} · {car.color}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-blue-400 text-xl font-bold">${car.rate_per_mile}</span>
                      <p className="text-gray-500 text-xs">per mile</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    {car.tesla_vehicle_id && (
                      <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-1 rounded-full border border-blue-500/30">
                        Tesla API Live
                      </span>
                    )}
                    <span className="bg-green-600/20 text-green-400 text-xs px-2 py-1 rounded-full border border-green-500/30">
                      Available
                    </span>
                  </div>
                  {user ? (
                    <Link
                      href={`/cars/${car.id}/book`}
                      className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-medium transition"
                    >
                      Book Now
                    </Link>
                  ) : (
                    <Link
                      href="/auth/login"
                      className="block w-full text-center border border-white/20 hover:border-white/40 text-white py-2.5 rounded-lg transition"
                    >
                      Sign In to Book
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
