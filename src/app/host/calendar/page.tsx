export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AvailabilityCalendar from './AvailabilityCalendar'

export default async function HostCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'host' && profile?.role !== 'admin') redirect('/dashboard')

  const { data: cars } = await adminClient
    .from('cars')
    .select('id, name, image_url, listing_status')
    .eq('host_id', user.id)
    .order('created_at')

  if (!cars?.length) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Calendar</h1>
        <p className="text-gray-500">You don't have any cars listed yet.</p>
      </div>
    )
  }

  // Load blocked dates and bookings for all cars
  const carIds = cars.map(c => c.id)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const endOfRange = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString().slice(0, 10)

  const [{ data: blocked }, { data: bookings }] = await Promise.all([
    adminClient.from('car_availability').select('*').in('car_id', carIds),
    adminClient.from('bookings')
      .select('car_id, start_date, end_date, status, guest_id')
      .in('car_id', carIds)
      .in('status', ['pending', 'active'])
      .gte('end_date', startOfMonth),
  ])

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Calendar</h1>
      <p className="text-gray-500 text-sm mb-8">Manage availability for your cars. Click days to block or unblock them.</p>
      <AvailabilityCalendar
        cars={cars}
        initialBlocked={blocked ?? []}
        bookings={bookings ?? []}
      />
    </div>
  )
}
