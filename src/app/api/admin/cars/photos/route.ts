import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

// POST: upload a photo for a car
export async function POST(req: NextRequest) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const carId = formData.get('car_id') as string | null
  const isPrimary = formData.get('is_primary') === 'true'

  if (!file || !carId) return NextResponse.json({ error: 'Missing file or car_id' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${carId}/${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await adminClient.storage
    .from('car-images')
    .upload(path, bytes, { contentType: file.type, upsert: true })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = adminClient.storage.from('car-images').getPublicUrl(path)

  // If first photo or explicitly primary, set is_primary
  const { count } = await adminClient.from('car_photos').select('id', { count: 'exact', head: true }).eq('car_id', carId)
  const setAsPrimary = isPrimary || count === 0

  if (setAsPrimary) {
    await adminClient.from('car_photos').update({ is_primary: false }).eq('car_id', carId)
  }

  const { data: photo, error } = await adminClient.from('car_photos').insert({
    car_id: carId,
    url: publicUrl,
    is_primary: setAsPrimary,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ photo })
}

// DELETE: remove a photo record
export async function DELETE(req: NextRequest) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { photo_id } = await req.json()
  if (!photo_id) return NextResponse.json({ error: 'Missing photo_id' }, { status: 400 })

  const { error } = await adminClient.from('car_photos').delete().eq('id', photo_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
