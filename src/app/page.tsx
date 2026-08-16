import Link from 'next/link'
import { Car, MapPin, DollarSign, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <nav className="border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <span className="text-xl font-bold text-white">⚡ Paymiles</span>
        <div className="flex gap-3">
          <Link href="/auth/login" className="text-gray-300 hover:text-white px-4 py-2 rounded-lg transition">
            Sign In
          </Link>
          <Link href="/auth/register" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition font-medium">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="inline-block bg-blue-600/20 text-blue-400 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-blue-500/30">
          Tesla Fleet — Pay Per Mile
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-3xl">
          Drive Now,<br />
          <span className="text-blue-400">Pay For Miles</span>
        </h1>
        <p className="text-gray-400 text-xl max-w-xl mb-10">
          Rent premium Tesla vehicles and only pay for the exact miles you drive.
          Real-time odometer tracking via Tesla API.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="/cars" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-lg font-medium transition">
            Browse Cars
          </Link>
          <Link href="/auth/login" className="border border-white/20 hover:border-white/40 text-white px-8 py-3 rounded-xl text-lg transition">
            My Bookings
          </Link>
        </div>
      </main>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-px border-t border-white/10 bg-white/10">
        {[
          { icon: Car, title: 'Tesla Fleet', desc: 'Model S, 3, X & Y available' },
          { icon: MapPin, title: 'Live Odometer', desc: 'Real-time miles via Tesla API' },
          { icon: DollarSign, title: 'Pay Per Mile', desc: 'Precise billing, no flat daily rates' },
          { icon: Shield, title: 'Insured', desc: 'Fully covered on every trip' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-gray-950 px-8 py-8">
            <Icon className="text-blue-400 mb-3" size={28} />
            <h3 className="font-semibold text-white mb-1">{title}</h3>
            <p className="text-gray-400 text-sm">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
