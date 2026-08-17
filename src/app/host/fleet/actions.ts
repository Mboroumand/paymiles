'use server'

import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleVehicleActive(carId: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: car } = await adminClient.from('cars').select('host_id').eq('id', carId).single()
  if (!car) return { error: 'Car not found' }

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (car.host_id !== user.id && profile?.role !== 'admin') return { error: 'Not authorized' }

  const { error } = await adminClient.from('cars').update({ is_active: isActive }).eq('id', carId)
  if (error) return { error: error.message }

  revalidatePath('/host/fleet')
  return { success: true }
}

export async function updateCarPhoto(carId: string, imageUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: car } = await adminClient.from('cars').select('host_id').eq('id', carId).single()
  if (!car) return { error: 'Car not found' }

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (car.host_id !== user.id && profile?.role !== 'admin') return { error: 'Not authorized' }

  const { error } = await adminClient.from('cars').update({ image_url: imageUrl }).eq('id', carId)
  if (error) return { error: error.message }

  revalidatePath('/host/fleet')
  return { success: true }
}
