'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const nav = [
  {
    href: '/host',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/host/trips',
    label: 'Trips',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    href: '/host/fleet',
    label: 'Fleet',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M5 17H3a2 2 0 01-2-2V7a2 2 0 012-2h11l4 4v6a2 2 0 01-2 2h-2" />
        <circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
      </svg>
    ),
  },
  {
    href: '/host/calendar',
    label: 'Calendar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: '/host/earnings',
    label: 'Earnings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
]

export default function HostSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-[72px] bg-white border-r border-gray-200 flex flex-col items-center py-4 z-40 shadow-sm">
      {/* Logo */}
      <Link href="/host" className="mb-6 w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
        <span className="text-white font-black text-[10px] leading-tight text-center">PM</span>
      </Link>

      <nav className="flex flex-col items-center gap-1 w-full flex-1">
        {nav.map(({ href, label, icon }) => {
          const active = href === '/host' ? pathname === '/host' : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-1 py-2.5 w-full transition-colors ${
                active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
              }`}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
                active ? 'bg-gray-100' : 'hover:bg-gray-100'
              }`}>
                {icon}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Guest switch + Sign out */}
      <Link href="/dashboard" className="flex flex-col items-center gap-1 py-2.5 text-gray-400 hover:text-gray-700 transition-colors w-full">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <span className="text-[10px] font-medium">Guest</span>
      </Link>

      <button onClick={signOut} className="flex flex-col items-center gap-1 py-2.5 text-gray-400 hover:text-red-500 transition-colors w-full">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-red-50">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5M21 12H9" />
          </svg>
        </div>
        <span className="text-[10px] font-medium">Sign out</span>
      </button>
    </aside>
  )
}
