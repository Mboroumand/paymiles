import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AddCarForm from './AddCarForm'
import CarActions from './CarActions'

export default async function AdminCarsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: cars } = await supabase.from('cars').select('*').order('created_at', { ascending: false })

  return (
    <div className="min-h-screen">
      <Navbar role="admin" />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-8">Car Fleet</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Add Car</h2>
            <AddCarForm />
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">All Cars ({cars?.length ?? 0})</h2>
            <div className="space-y-4">
              {cars?.map(car => (
                <div key={car.id} className="bg-gray-900 border border-white/10 rounded-xl p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{car.name}</h3>
                      <p className="text-gray-400 text-sm">{car.year} · {car.model} · {car.color}</p>
                      <p className="text-gray-500 text-xs mt-1">VIN: {car.vin ?? 'N/A'} · Plate: {car.license_plate ?? 'N/A'}</p>
                      {car.tesla_vehicle_id && (
                        <p className="text-blue-400 text-xs mt-1">🔗 Tesla ID: {car.tesla_vehicle_id}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-blue-400 font-bold text-lg">${car.rate_per_mile}/mi</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        car.status === 'available' ? 'bg-green-600/20 text-green-400 border-green-500/30' :
                        car.status === 'rented' ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' :
                        'bg-yellow-600/20 text-yellow-400 border-yellow-500/30'
                      }`}>{car.status}</span>
                    </div>
                  </div>
                  <CarActions carId={car.id} currentStatus={car.status} teslaVehicleId={car.tesla_vehicle_id} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
