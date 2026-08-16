import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <p className="text-8xl font-bold text-gray-700 mb-4">404</p>
      <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
      <p className="text-gray-400 mb-8">The page you're looking for doesn't exist.</p>
      <Link href="/" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl transition">
        Go Home
      </Link>
    </div>
  )
}
