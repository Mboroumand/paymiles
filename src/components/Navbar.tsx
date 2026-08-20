'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface NavbarProps {
  role?: string
}

export default function Navbar({ role }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-xs">PM</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">Paymiles</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          <Link href="/cars"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${pathname === '/cars' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
            Browse Cars
          </Link>

          {role === 'admin' && (
            <Link href="/admin"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition">
              Admin
            </Link>
          )}
          {role === 'host' && (
            <Link href="/host"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition">
              Host Dashboard
            </Link>
          )}
          {role === 'guest' && (
            <>
              <Link href="/dashboard"
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition">
                My Trips
              </Link>
              <Link href="/dashboard/profile"
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition">
                Profile
              </Link>
            </>
          )}

          {role ? (
            <button onClick={signOut}
              className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition">
              Sign Out
            </button>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link href="/auth/login"
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
                Log in
              </Link>
              <Link href="/auth/register"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition">
                Sign up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2 text-gray-600" onClick={() => setOpen(!open)}>
          {open ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 px-6 py-4 flex flex-col gap-2 bg-white">
          <Link href="/cars" className="py-2 text-sm text-gray-700 font-medium">Browse Cars</Link>
          {role === 'admin' && <Link href="/admin" className="py-2 text-sm text-gray-700">Admin</Link>}
          {role === 'host' && <Link href="/host" className="py-2 text-sm text-gray-700">Host Dashboard</Link>}
          {role === 'guest' && <Link href="/dashboard" className="py-2 text-sm text-gray-700">My Trips</Link>}
          {role === 'guest' && <Link href="/dashboard/profile" className="py-2 text-sm text-gray-700">Profile</Link>}
          {role ? (
            <button onClick={signOut} className="text-left py-2 text-sm text-red-500">Sign Out</button>
          ) : (
            <>
              <Link href="/auth/login" className="py-2 text-sm text-gray-700">Log in</Link>
              <Link href="/auth/register" className="py-2 text-sm text-gray-700 font-semibold">Sign up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
