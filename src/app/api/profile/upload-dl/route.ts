import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const side = formData.get('side') as string | null // 'front' | 'back'

  if (!file || !side) return NextResponse.json({ error: 'Missing file or side' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/${side}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error } = await adminClient.storage
    .from('dl-photos')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: signed } = await adminClient.storage
    .from('dl-photos')
    .createSignedUrl(path, 60 * 60 * 24 * 365) // 1 year

  return NextResponse.json({ url: path, signedUrl: signed?.signedUrl })
}
