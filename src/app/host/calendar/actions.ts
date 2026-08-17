'use server'
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleBlockedDate(carId: string, date: string, blocked: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: car } = await adminClient.from('cars').select('host_id').eq('id', carId).single()
  if (!car || car.host_id !== user.id) return { error: 'Not authorized' }

  if (blocked) {
    await adminClient.from('car_availability').upsert(
      { car_id: carId, date, is_blocked: true },
      { onConflict: 'car_id,date' }
    )
  } else {
    await adminClient.from('car_availability').delete().eq('car_id', carId).eq('date', date)
  }

  revalidatePath('/host/calendar')
  return { success: true }
}
