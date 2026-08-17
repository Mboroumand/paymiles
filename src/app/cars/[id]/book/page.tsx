import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookingForm from './BookingForm'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default async function BookPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ delivery?: string }> }) {
  const { id } = await params
  const { delivery } = await searchParams
  const wantsDelivery = delivery === '1'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const { data: car } = await supabase.from('cars').select('*').eq('id', id).single()

  if (!car) redirect('/cars')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role={profile?.role} />

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Back */}
        <Link href={`/cars/${id}`} className="text-sm text-gray-400 hover:text-gray-700 transition flex items-center gap-1 mb-6">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" />
          </svg>
          Back to car details
        </Link>

        {/* Car summary card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex gap-4 items-center mb-6 shadow-sm">
          {car.image_url ? (
            <img src={car.image_url} alt={car.name} className="w-20 h-14 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-20 h-14 rounded-xl bg-gray-100 flex-shrink-0 flex items-center justify-center text-2xl">🚗</div>
          )}
          <div>
            <h1 className="font-bold text-gray-900 text-lg">{car.name}</h1>
            <p className="text-gray-400 text-sm">{car.year}{car.color ? ` · ${car.color}` : ''}</p>
          </div>
          <div className="ml-auto text-right">
            <span className="text-gray-900 font-bold text-xl">${car.rate_per_mile}</span>
            <p className="text-gray-400 text-xs">per mile</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Complete your booking</h2>
          <BookingForm car={car} userId={user.id} wantsDelivery={wantsDelivery} />
        </div>
      </div>
    </div>
  )
}
