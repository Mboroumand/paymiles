'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Car, LayoutDashboard, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

interface NavbarProps {
  role?: string
}

export default function Navbar({ role }: NavbarProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="border-b border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-white">⚡ Paymiles</Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/cars" className="text-gray-300 hover:text-white transition flex items-center gap-1.5">
            <Car size={16} /> Cars
          </Link>
          {role === 'admin' ? (
            <Link href="/admin" className="text-gray-300 hover:text-white transition flex items-center gap-1.5">
              <LayoutDashboard size={16} /> Admin
            </Link>
          ) : role === 'guest' ? (
            <Link href="/dashboard" className="text-gray-300 hover:text-white transition flex items-center gap-1.5">
              <LayoutDashboard size={16} /> Dashboard
            </Link>
          ) : null}
          {role ? (
            <button onClick={signOut} className="flex items-center gap-1.5 text-gray-300 hover:text-red-400 transition">
              <LogOut size={16} /> Sign Out
            </button>
          ) : (
            <Link href="/auth/login" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition">
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden mt-4 flex flex-col gap-3 px-2">
          <Link href="/cars" className="text-gray-300 hover:text-white py-2">Cars</Link>
          {role === 'admin' && <Link href="/admin" className="text-gray-300 hover:text-white py-2">Admin</Link>}
          {role === 'guest' && <Link href="/dashboard" className="text-gray-300 hover:text-white py-2">Dashboard</Link>}
          {role ? (
            <button onClick={signOut} className="text-left text-red-400 py-2">Sign Out</button>
          ) : (
            <Link href="/auth/login" className="text-blue-400 py-2">Sign In</Link>
          )}
        </div>
      )}
    </nav>
  )
}
