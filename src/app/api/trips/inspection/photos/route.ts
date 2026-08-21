import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File
  const inspection_id = form.get('inspection_id') as string
  const label = form.get('label') as string | null

  if (!file || !inspection_id) {
    return NextResponse.json({ error: 'file and inspection_id required' }, { status: 400 })
  }

  // Check photo limit (max 20)
  const { count } = await adminClient
    .from('trip_inspection_photos')
    .select('id', { count: 'exact', head: true })
    .eq('inspection_id', inspection_id)

  if ((count ?? 0) >= 20) {
    return NextResponse.json({ error: 'Maximum 20 photos per inspection' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `trips/${inspection_id}/${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await adminClient.storage
    .from('car-images')
    .upload(path, bytes, { contentType: file.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = adminClient.storage.from('car-images').getPublicUrl(path)

  const { data: photo, error } = await adminClient
    .from('trip_inspection_photos')
    .insert({ inspection_id, url: publicUrl, label: label ?? null })
    .select('id, url')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(photo)
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { photo_id } = await req.json()
  if (!photo_id) return NextResponse.json({ error: 'photo_id required' }, { status: 400 })

  await adminClient.from('trip_inspection_photos').delete().eq('id', photo_id)
  return NextResponse.json({ ok: true })
}
