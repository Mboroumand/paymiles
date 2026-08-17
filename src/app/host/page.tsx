import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default async function HostDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'host' && profile?.role !== 'admin') redirect('/dashboard')

  const { data: cars } = await supabase
    .from('cars')
    .select('*')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })

  const statusColor = {
    pending: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
    approved: 'bg-green-600/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-600/20 text-red-400 border-red-500/30',
  }

  return (
    <div className="min-h-screen">
      <Navbar role="host" />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Cars</h1>
          <Link href="/host/cars/submit"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            + Submit a Car
          </Link>
        </div>

        {!cars?.length ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">No cars submitted yet.</p>
            <Link href="/host/cars/submit" className="text-blue-400 hover:underline mt-2 inline-block">
              Submit your first car →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {cars.map(car => (
              <div key={car.id} className="bg-gray-900 border border-white/10 rounded-xl p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{car.name}</h3>
                    <p className="text-gray-400 text-sm">{car.year} · {car.model}{car.color ? ` · ${car.color}` : ''}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {car.vin ? `VIN: ${car.vin}` : 'No VIN'} · {car.license_plate ?? 'No plate'}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-blue-400 font-bold">${car.rate_per_mile}/mi</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[car.listing_status as keyof typeof statusColor]}`}>
                      {car.listing_status}
                    </span>
                  </div>
                </div>
                {car.listing_status === 'rejected' && (
                  <p className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    Your car was not approved. Contact support or submit a new listing.
                  </p>
                )}
                {car.listing_status === 'pending' && (
                  <p className="mt-3 text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                    Awaiting admin approval. You'll be notified once reviewed.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
