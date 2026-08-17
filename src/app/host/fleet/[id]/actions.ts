'use server'

import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getAuthorizedUser(carId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: car } = await adminClient.from('cars').select('host_id').eq('id', carId).single()
  if (!car) return { error: 'Car not found' }
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (car.host_id !== user.id && profile?.role !== 'admin') return { error: 'Not authorized' }
  return { user, car }
}

export async function updateCarPhoto(carId: string, imageUrl: string) {
  const auth = await getAuthorizedUser(carId)
  if ('error' in auth && auth.error) return { error: auth.error }
  const { error } = await adminClient.from('cars').update({ image_url: imageUrl }).eq('id', carId)
  if (error) return { error: error.message }
  revalidatePath(`/host/fleet/${carId}`)
  revalidatePath('/host/fleet')
  return { success: true }
}

export async function updateCarDetails(carId: string, data: Record<string, any>) {
  const auth = await getAuthorizedUser(carId)
  if ('error' in auth && auth.error) return { error: auth.error }
  const { error } = await adminClient.from('cars').update(data).eq('id', carId)
  if (error) return { error: error.message }
  revalidatePath(`/host/fleet/${carId}`)
  revalidatePath('/host/fleet')
  return { success: true }
}

export async function linkTeslaVehicle(carId: string, teslaVehicleId: string) {
  const auth = await getAuthorizedUser(carId)
  if ('error' in auth && auth.error) return { error: auth.error }
  const { error } = await adminClient.from('cars').update({ tesla_vehicle_id: teslaVehicleId }).eq('id', carId)
  if (error) return { error: error.message }
  revalidatePath(`/host/fleet/${carId}`)
  return { success: true }
}

export async function toggleVehicleActive(carId: string, isActive: boolean) {
  const auth = await getAuthorizedUser(carId)
  if ('error' in auth && auth.error) return { error: auth.error }
  const { error } = await adminClient.from('cars').update({ is_active: isActive }).eq('id', carId)
  if (error) return { error: error.message }
  revalidatePath(`/host/fleet/${carId}`)
  revalidatePath('/host/fleet')
  return { success: true }
}
