import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { full_name, phone, date_of_birth, dl_number, dl_expiry, dl_front_url, dl_back_url } = body

  if (!dl_number || !dl_expiry) {
    return NextResponse.json({ error: "Driver's license number and expiry are required" }, { status: 400 })
  }
  if (!dl_front_url || !dl_back_url) {
    return NextResponse.json({ error: "Please upload both front and back photos of your license" }, { status: 400 })
  }

  const { error } = await adminClient.from('profiles').upsert({
    id: user.id,
    email: user.email,
    full_name,
    phone,
    date_of_birth: date_of_birth || null,
    dl_number,
    dl_expiry,
    dl_front_url,
    dl_back_url,
    dl_status: 'pending',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
