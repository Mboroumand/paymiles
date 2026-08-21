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

export async function toggleFsd(carId: string, hasFsd: boolean) {
  const auth = await getAuthorizedUser(carId)
  if ('error' in auth && auth.error) return { error: auth.error }
  const { error } = await adminClient.from('cars').update({ has_fsd: hasFsd }).eq('id', carId)
  if (error) return { error: error.message }
  revalidatePath(`/host/fleet/${carId}`)
  return { success: true }
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

export async function addCarPhoto(carId: string, url: string, isFirst: boolean) {
  const auth = await getAuthorizedUser(carId)
  if ('error' in auth && auth.error) return { error: auth.error }
  const { error } = await adminClient.from('car_photos').insert({ car_id: carId, url, is_primary: isFirst })
  if (error) return { error: error.message }
  // If first photo, also set as main image_url
  if (isFirst) await adminClient.from('cars').update({ image_url: url }).eq('id', carId)
  revalidatePath(`/host/fleet/${carId}`)
  return { success: true }
}

export async function deleteCarPhoto(photoId: string, carId: string, wasPrimary: boolean) {
  const auth = await getAuthorizedUser(carId)
  if ('error' in auth && auth.error) return { error: auth.error }
  await adminClient.from('car_photos').delete().eq('id', photoId)
  if (wasPrimary) {
    // Promote next photo to primary
    const { data: next } = await adminClient.from('car_photos').select('id, url').eq('car_id', carId).order('created_at').limit(1).single()
    if (next) {
      await adminClient.from('car_photos').update({ is_primary: true }).eq('id', next.id)
      await adminClient.from('cars').update({ image_url: next.url }).eq('id', carId)
    } else {
      await adminClient.from('cars').update({ image_url: null }).eq('id', carId)
    }
  }
  revalidatePath(`/host/fleet/${carId}`)
  revalidatePath('/host/fleet')
  return { success: true }
}

export async function setMainPhoto(photoId: string, carId: string, url: string) {
  const auth = await getAuthorizedUser(carId)
  if ('error' in auth && auth.error) return { error: auth.error }
  await adminClient.from('car_photos').update({ is_primary: false }).eq('car_id', carId)
  await adminClient.from('car_photos').update({ is_primary: true }).eq('id', photoId)
  await adminClient.from('cars').update({ image_url: url }).eq('id', carId)
  revalidatePath(`/host/fleet/${carId}`)
  revalidatePath('/host/fleet')
  revalidatePath(`/cars/${carId}`)
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
