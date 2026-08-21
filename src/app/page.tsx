import Link from 'next/link'
import Image from 'next/image'
import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function getFeaturedCars() {
  const { data } = await adminClient
    .from('cars')
    .select('id, name, model, year, color, rate_per_mile, included_miles_per_day, image_url, location, has_fsd, listing_status')
    .eq('listing_status', 'approved')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(6)
  return data ?? []
}

export default async function HomePage() {
  const cars = await getFeaturedCars()

  return (
    <div className="min-h-screen bg-[#080c14] text-white">

      {/* Announcement bar */}
      <div className="bg-blue-600 text-white text-center text-sm py-2.5 px-4 font-medium">
        No flat daily rates — you only pay for the exact miles you drive.{' '}
        <Link href="/cars" className="underline underline-offset-2 hover:no-underline">Browse Teslas →</Link>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/8 bg-[#080c14]/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight">
              <span className="text-white">pay</span><span className="text-blue-400">miles</span>
            </span>
            <span className="text-xs text-white/30 font-medium mt-0.5">⚡</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <Link href="/cars" className="hover:text-white transition">Browse Teslas</Link>
            <Link href="/host/cars/submit" className="hover:text-white transition">Become a Host</Link>
            <Link href="/dashboard" className="hover:text-white transition">Dashboard</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-white/70 hover:text-white text-sm px-4 py-2 rounded-lg transition">
              Sign in
            </Link>
            <Link href="/auth/register" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-5 py-2.5 rounded-xl font-semibold transition">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[700px] h-[500px] bg-blue-600/12 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/8 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 grid md:grid-cols-2 gap-16 items-center relative">
          {/* Left: Copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-7 uppercase tracking-widest">
              ⚡ Tesla-Exclusive Fleet
            </div>
            <h1 className="text-5xl md:text-6xl font-black leading-[1.05] tracking-tight mb-6">
              Drive Tesla.<br />
              Pay for<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                every mile.
              </span>
            </h1>
            <p className="text-white/55 text-lg leading-relaxed mb-10 max-w-md">
              Rent a Tesla and pay only for the exact miles you travel — tracked live via Tesla's API. No flat daily fees. No guessing.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/cars"
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl text-base font-bold transition shadow-lg shadow-blue-600/25">
                Browse available Teslas
              </Link>
              <Link href="/host/cars/submit"
                className="border border-white/15 hover:border-white/30 hover:bg-white/5 text-white/80 hover:text-white px-8 py-3.5 rounded-xl text-base font-medium transition">
                List your Tesla
              </Link>
            </div>

            {/* Mini stats */}
            <div className="flex gap-8 mt-12 pt-8 border-t border-white/8">
              {[
                { value: `${cars.length}+`, label: 'Teslas available' },
                { value: '100%', label: 'Electric fleet' },
                { value: '$0', label: 'Hidden fees' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-white/40 text-xs mt-0.5 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Car visual grid */}
          <div className="relative hidden md:block">
            {cars.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {cars.slice(0, 4).map((car, i) => (
                  <Link href={`/cars/${car.id}`} key={car.id}
                    className={`group relative overflow-hidden rounded-2xl bg-white/5 border border-white/8 aspect-video hover:border-blue-500/40 transition-all duration-300 ${i === 0 ? 'col-span-2' : ''}`}>
                    {car.image_url ? (
                      <img src={car.image_url} alt={car.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-900/30 to-gray-900 flex items-center justify-center">
                        <span className="text-4xl opacity-30">⚡</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-sm font-bold text-white">{car.name}</p>
                      <p className="text-xs text-white/60">${car.rate_per_mile}/mi{car.has_fsd ? ' · FSD' : ''}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              /* Decorative placeholder when no cars */
              <div className="relative">
                <div className="rounded-3xl bg-gradient-to-br from-blue-900/20 to-gray-900/60 border border-white/8 aspect-[4/3] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-8xl mb-4 opacity-20">⚡</div>
                    <p className="text-white/20 text-sm">Tesla fleet coming soon</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/6 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">Simple as 1 – 2 – 3</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">How Paymiles works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Pick your Tesla',
                desc: 'Browse Model 3, Y, S, X and Cybertruck listings near you. Filter by FSD, range, or price per mile.',
                icon: '🔍',
              },
              {
                step: '02',
                title: 'Drive it your way',
                desc: 'Dates, pickup location, delivery — book and go. Odometer is recorded at start via Tesla API.',
                icon: '🚗',
              },
              {
                step: '03',
                title: 'Pay only what you drove',
                desc: "Return the car, we read the odometer, you pay for exact miles. That's it — no surprise charges.",
                icon: '💸',
              },
            ].map((s, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/8 rounded-2xl p-8 hover:border-blue-500/30 transition group">
                <div className="flex items-start gap-4 mb-5">
                  <span className="text-4xl">{s.icon}</span>
                  <span className="text-5xl font-black text-white/8 leading-none group-hover:text-blue-500/20 transition">{s.step}</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured cars */}
      {cars.length > 0 && (
        <section className="border-t border-white/6 py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Available now</p>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight">Featured Teslas</h2>
              </div>
              <Link href="/cars" className="text-sm text-white/50 hover:text-white transition font-medium">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {cars.map(car => (
                <Link href={`/cars/${car.id}`} key={car.id}
                  className="group bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-0.5">
                  {/* Photo */}
                  <div className="aspect-video bg-gray-900 overflow-hidden relative">
                    {car.image_url ? (
                      <img src={car.image_url} alt={car.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/20 to-gray-900">
                        <span className="text-5xl opacity-20">⚡</span>
                      </div>
                    )}
                    {car.has_fsd && (
                      <div className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        FSD
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <p className="font-bold text-white text-base leading-tight">{car.name}</p>
                        <p className="text-white/35 text-xs mt-0.5">{car.year} · {car.color ?? car.model}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-white font-black text-lg leading-tight">${car.rate_per_mile}</p>
                        <p className="text-white/35 text-[10px] font-medium">per mile</p>
                      </div>
                    </div>
                    {car.location && (
                      <p className="text-white/30 text-xs mt-3 flex items-center gap-1">
                        <span>📍</span> {car.location.split(',').slice(-2).join(',').trim()}
                      </p>
                    )}
                    {car.included_miles_per_day && (
                      <p className="text-white/30 text-xs mt-1">
                        {car.included_miles_per_day} free miles/day included
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Host CTA */}
      <section className="border-t border-white/6 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600/15 to-blue-900/10 border border-blue-500/20 rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center gap-10 justify-between">
            <div className="max-w-lg">
              <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">For Tesla owners</p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
                Your Tesla earns<br />while you don't drive.
              </h2>
              <p className="text-white/50 text-base leading-relaxed">
                List your Tesla in minutes. Guests pay per mile — you keep 90% of every dollar. Live odometer tracking means you're always in control.
              </p>
            </div>
            <div className="flex-shrink-0 text-center">
              <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                {[
                  { n: '90%', l: 'earnings you keep' },
                  { n: '$0', l: 'listing fee' },
                  { n: '⚡', l: 'Tesla API connected' },
                  { n: '🔒', l: 'insured bookings' },
                ].map(s => (
                  <div key={s.l} className="bg-white/5 border border-white/8 rounded-xl px-4 py-3">
                    <p className="text-xl font-black">{s.n}</p>
                    <p className="text-white/40 text-xs mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>
              <Link href="/host/cars/submit"
                className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold transition shadow-lg shadow-blue-600/30">
                List my Tesla →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tesla models strip */}
      <section className="border-t border-white/6 py-14 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-white/25 text-xs font-medium uppercase tracking-widest mb-8">Fleet includes</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'].map(m => (
              <Link href={`/cars?model=${encodeURIComponent(m)}`} key={m}
                className="border border-white/10 hover:border-blue-500/40 hover:text-blue-400 text-white/50 text-sm font-medium px-6 py-2.5 rounded-full transition">
                {m}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/6 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-lg font-black">
            <span className="text-white">pay</span><span className="text-blue-400">miles</span>
            <span className="text-white/20 text-xs ml-2 font-normal">⚡ Tesla-exclusive</span>
          </span>
          <div className="flex gap-6 text-white/35 text-sm">
            <Link href="/cars" className="hover:text-white transition">Browse</Link>
            <Link href="/host/cars/submit" className="hover:text-white transition">Host</Link>
            <Link href="/auth/login" className="hover:text-white transition">Sign in</Link>
            <Link href="/auth/register" className="hover:text-white transition">Register</Link>
          </div>
          <p className="text-white/20 text-xs">© 2025 Paymiles. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
