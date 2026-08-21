export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AddCarForm from './AddCarForm'
import CarActions from './CarActions'
import ApprovalActions from './ApprovalActions'
import EditCarForm from './EditCarForm'

export default async function AdminCarsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: cars } = await adminClient
    .from('cars')
    .select('*, host:profiles!cars_host_id_fkey(full_name, email)')
    .order('created_at', { ascending: false })

  const pending = cars?.filter(c => c.listing_status === 'pending') ?? []
  const rest = cars?.filter(c => c.listing_status !== 'pending') ?? []

  const statusStyle: Record<string, string> = {
    available: 'bg-green-100 text-green-700 border-green-200',
    rented: 'bg-blue-100 text-blue-700 border-blue-200',
    maintenance: 'bg-gray-100 text-gray-500 border-gray-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-600 border-red-200',
  }

  return (
    <div className="p-8 max-w-7xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Cars</h1>
      <p className="text-gray-500 text-sm mb-8">{cars?.length ?? 0} vehicles total</p>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="font-semibold text-gray-900">Pending Approval</h2>
            <span className="bg-amber-100 text-amber-700 border border-amber-200 text-xs px-2 py-0.5 rounded-full font-medium">{pending.length}</span>
          </div>
          <div className="space-y-3">
            {pending.map(car => (
              <div key={car.id} className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm">
                <div className="flex gap-4">
                  {car.image_url && <img src={car.image_url} className="w-20 h-14 rounded-xl object-cover flex-shrink-0" alt="" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">{car.name}</p>
                        <p className="text-gray-500 text-sm">{car.year}{car.color ? ` · ${car.color}` : ''}</p>
                        {car.host && <p className="text-purple-600 text-xs mt-1">Host: {car.host.full_name ?? car.host.email}</p>}
                        {car.license_plate && <p className="text-gray-400 text-xs">Plate: {car.license_plate}</p>}
                      </div>
                      <p className="text-blue-600 font-bold text-lg flex-shrink-0">${car.rate_per_mile}/mi</p>
                    </div>
                    <div className="mt-3">
                      <ApprovalActions carId={car.id} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All cars + add form */}
      <div className="space-y-6">
        <AddCarForm />

        <div>
          <h2 className="font-semibold text-gray-900 mb-4">All Cars ({rest.length})</h2>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {rest.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-12">No cars yet</p>
            )}
            {rest.map((car, idx) => (
              <div key={car.id} className={`flex gap-4 p-5 hover:bg-gray-50 transition ${idx !== 0 ? 'border-t border-gray-100' : ''}`}>
                {car.image_url ? (
                  <img src={car.image_url} className="w-20 h-14 rounded-xl object-cover flex-shrink-0" alt="" />
                ) : (
                  <div className="w-20 h-14 rounded-xl bg-gray-100 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{car.name}</p>
                      <p className="text-gray-400 text-xs">{car.year}{car.color ? ` · ${car.color}` : ''}</p>
                      {car.host && <p className="text-purple-600 text-xs">Host: {car.host.full_name ?? car.host.email}</p>}
                    </div>
                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                      <p className="text-blue-600 font-bold text-sm">${car.rate_per_mile}/mi</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusStyle[car.listing_status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {car.listing_status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <CarActions carId={car.id} currentStatus={car.status} teslaVehicleId={car.tesla_vehicle_id} />
                    <EditCarForm car={car} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
