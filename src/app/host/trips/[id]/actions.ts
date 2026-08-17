'use server'

import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateTripStatus(tripId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify host owns this trip's car
  const { data: trip } = await adminClient.from('bookings').select('car_id').eq('id', tripId).single()
  if (!trip) return { error: 'Trip not found' }

  const { data: car } = await adminClient.from('cars').select('host_id').eq('id', trip.car_id).single()
  if (!car) return { error: 'Car not found' }

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (car.host_id !== user.id && profile?.role !== 'admin') return { error: 'Not authorized' }

  const { error } = await adminClient.from('bookings').update({ status }).eq('id', tripId)
  if (error) return { error: error.message }

  revalidatePath(`/host/trips/${tripId}`)
  revalidatePath('/host/trips')
  return { success: true }
}
