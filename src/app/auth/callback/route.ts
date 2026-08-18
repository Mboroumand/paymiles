import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const next = req.nextUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      // Ensure profile exists for OAuth users
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      const role = profile?.role ?? 'guest'
      const dest = role === 'host' ? '/host' : role === 'admin' ? '/admin' : next
      return NextResponse.redirect(new URL(dest, req.url))
    }
  }

  return NextResponse.redirect(new URL('/auth/login?error=oauth_failed', req.url))
}
