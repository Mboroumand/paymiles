export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import BookingSidebar from './BookingSidebar'

export default async function CarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role: string | undefined
  let dlStatus: string | undefined
  if (user) {
    const { data } = await supabase.from('profiles').select('role, dl_status').eq('id', user.id).single()
    role = data?.role
    dlStatus = data?.dl_status
  }

  const [{ data: car }, { data: photos }] = await Promise.all([
    supabase.from('cars').select('*, host:profiles!cars_host_id_fkey(full_name)').eq('id', id).single(),
    adminClient.from('car_photos').select('*').eq('car_id', id).order('is_primary', { ascending: false }).order('created_at'),
  ])

  if (!car) redirect('/cars')

  // Build ordered photo list: primary first, fallback to image_url
  const photoUrls: string[] = photos && photos.length > 0
    ? photos.map((p: { url: string }) => p.url)
    : car.image_url ? [car.image_url] : []

  const features = [
    { label: '5 seats', icon: '👥' },
    { label: 'Electric', icon: '⚡' },
    ...(car.has_fsd ? [{ label: 'Full Self-Driving', icon: '🚗' }] : [{ label: 'Autopilot', icon: '🤖' }]),
    { label: 'Auto transmission', icon: '⚙️' },
  ]

  const included = [
    { title: 'Pay per mile only', desc: 'You only pay for the miles you actually drive — no daily rate.', icon: '📍' },
    { title: 'Tesla Autopilot', desc: 'Advanced driver-assistance with lane keeping and adaptive cruise.', icon: '🤖' },
    { title: 'Mobile key access', desc: 'Unlock and start the vehicle from your phone.', icon: '📱' },
    { title: 'Supercharger ready', desc: 'Charge at any Tesla Supercharger on your trip.', icon: '⚡' },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar role={role} />

      {/* Back link */}
      <div className="max-w-7xl mx-auto px-6 pt-5 pb-2">
        <Link href="/cars" className="text-sm text-gray-400 hover:text-gray-700 transition flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" />
          </svg>
          All cars
        </Link>
      </div>

      {/* Photo gallery */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="grid grid-cols-[1fr_240px] gap-2 h-[420px] rounded-2xl overflow-hidden">
          {/* Main photo */}
          <div className="bg-gray-100 overflow-hidden">
            {photoUrls[0] ? (
              <img src={photoUrls[0]} alt={car.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">🚗</div>
            )}
          </div>
          {/* Side thumbnails */}
          <div className="grid grid-rows-2 gap-2">
            <div className="bg-gray-100 overflow-hidden">
              {photoUrls[1] ? (
                <img src={photoUrls[1]} alt="" className="w-full h-full object-cover" />
              ) : photoUrls[0] ? (
                <img src={photoUrls[0]} alt="" className="w-full h-full object-cover opacity-60" />
              ) : (
                <div className="w-full h-full bg-gray-200" />
              )}
            </div>
            <div className="bg-gray-100 overflow-hidden relative">
              {photoUrls[2] ? (
                <img src={photoUrls[2]} alt="" className="w-full h-full object-cover" />
              ) : photoUrls[0] ? (
                <img src={photoUrls[0]} alt="" className="w-full h-full object-cover opacity-40" />
              ) : (
                <div className="w-full h-full bg-gray-200" />
              )}
              {photoUrls.length > 3 && (
                <div className="absolute inset-0 bg-gray-900/50 flex items-end p-3">
                  <span className="text-white text-xs font-semibold bg-black/50 px-2.5 py-1 rounded-full">+{photoUrls.length - 3} more</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-[1fr_360px] gap-12 items-start">

          {/* Left: car info */}
          <div>
            {/* Title + meta */}
            <div className="pb-6 border-b border-gray-100">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{car.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span>{car.year}</span>
                {car.color && <><span className="text-gray-200">·</span><span>{car.color}</span></>}
                {car.host?.full_name && (
                  <>
                    <span className="text-gray-200">·</span>
                    <span className="flex items-center gap-1">
                      <span className="w-5 h-5 bg-gray-200 rounded-full inline-flex items-center justify-center text-xs font-bold text-gray-600">
                        {car.host.full_name[0]}
                      </span>
                      Hosted by {car.host.full_name}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Feature pills */}
            <div className="py-6 border-b border-gray-100">
              <div className="flex flex-wrap gap-3">
                {features.map(f => (
                  <span key={f.label}
                    className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-100 px-3 py-2 rounded-xl font-medium">
                    <span>{f.icon}</span>{f.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Included */}
            <div className="py-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">What's included</h2>
              <div className="grid grid-cols-2 gap-4">
                {included.map(item => (
                  <div key={item.title} className="flex gap-3">
                    <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            {car.location && (
              <div className="py-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Pickup location</h2>
                <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                  <span className="text-xl flex-shrink-0 mt-0.5">📍</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{car.location}</p>
                    <p className="text-gray-400 text-xs mt-0.5">Default pickup point — or request delivery to your address below.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle specs */}
            <div className="py-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Vehicle details</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Model', value: car.model || car.name },
                  { label: 'Year', value: car.year },
                  { label: 'Color', value: car.color || '—' },
                  { label: 'Plate', value: car.license_plate || '—' },
                  { label: 'Rate', value: `$${car.rate_per_mile}/mile` },
                  { label: 'FSD', value: car.has_fsd ? '✅ Included' : '—' },
                  { label: 'Location', value: car.location || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2 border-b border-gray-50 text-sm">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-gray-900 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* How per-mile billing works */}
            <div className="py-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">How Paymiles billing works</h2>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3 text-sm text-gray-700">
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <div><strong>Pick up the car</strong> — we record the starting odometer via Tesla API.</div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <div><strong>Drive wherever you want</strong> — we track miles driven automatically.</div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <div><strong>Return the car</strong> — you pay only for the miles you drove × ${car.rate_per_mile}/mi.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: sticky booking sidebar */}
          <div className="sticky top-20">
            <BookingSidebar car={{ id: car.id, name: car.name, rate_per_mile: car.rate_per_mile, location: car.location, included_miles_per_day: car.included_miles_per_day ?? 30 }} isLoggedIn={!!user} dlStatus={dlStatus} />
          </div>
        </div>
      </div>
    </div>
  )
}
