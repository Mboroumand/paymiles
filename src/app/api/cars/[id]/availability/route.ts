import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [{ data: blocked }, { data: bookings }] = await Promise.all([
    adminClient.from('car_availability').select('date').eq('car_id', id).eq('is_blocked', true),
    adminClient.from('bookings')
      .select('start_date, end_date')
      .eq('car_id', id)
      .in('status', ['pending', 'active'])
      .gte('end_date', new Date().toISOString()),
  ])

  const blockedDates = (blocked ?? []).map(b => b.date as string)

  // Expand booking ranges into individual dates
  const bookedDates: string[] = []
  for (const b of bookings ?? []) {
    if (!b.start_date || !b.end_date) continue
    const cur = new Date(b.start_date.slice(0, 10) + 'T00:00:00')
    const end = new Date(b.end_date.slice(0, 10) + 'T00:00:00')
    while (cur <= end) {
      bookedDates.push(cur.toISOString().slice(0, 10))
      cur.setDate(cur.getDate() + 1)
    }
  }

  return NextResponse.json({ blockedDates, bookedDates })
}
