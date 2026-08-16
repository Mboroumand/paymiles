import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookingForm from './BookingForm'
import Navbar from '@/components/Navbar'

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const { data: car } = await supabase.from('cars').select('*').eq('id', id).single()

  if (!car) redirect('/cars')

  return (
    <div className="min-h-screen">
      <Navbar role={profile?.role} />
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Book {car.name}</h1>
        <p className="text-gray-400 mb-8">
          {car.year} {car.model} · <span className="text-blue-400 font-semibold">${car.rate_per_mile}/mile</span>
        </p>
        <BookingForm car={car} userId={user.id} />
      </div>
    </div>
  )
}
