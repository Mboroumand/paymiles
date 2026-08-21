import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'host' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { booking_id, phase, odometer, battery_percent, notes } = body

  if (!booking_id || !phase || odometer == null) {
    return NextResponse.json({ error: 'booking_id, phase, and odometer are required' }, { status: 400 })
  }

  // Verify host owns this booking's car
  const { data: booking } = await adminClient
    .from('bookings')
    .select('id, status, car:cars(host_id)')
    .eq('id', booking_id)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (profile?.role !== 'admin' && booking.car?.host_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Upsert inspection
  const { data: inspection, error } = await adminClient
    .from('trip_inspections')
    .upsert({ booking_id, phase, odometer, battery_percent: battery_percent ?? null, notes: notes ?? null, created_by: user.id }, { onConflict: 'booking_id,phase' })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update booking status based on phase
  if (phase === 'checkin') {
    await adminClient.from('bookings').update({ status: 'active' }).eq('id', booking_id)
  } else if (phase === 'checkout') {
    // Fetch checkin odometer to calculate miles driven
    const { data: checkin } = await adminClient
      .from('trip_inspections')
      .select('odometer')
      .eq('booking_id', booking_id)
      .eq('phase', 'checkin')
      .single()

    const { data: car } = await adminClient.from('bookings').select('rate_per_mile').eq('id', booking_id).single()
    const miles = checkin ? Math.max(0, odometer - checkin.odometer) : null
    const total = miles != null && car?.rate_per_mile ? parseFloat((miles * car.rate_per_mile).toFixed(2)) : null

    await adminClient.from('bookings').update({
      status: 'completed',
      miles_driven: miles,
      ...(total != null ? { total_amount: total } : {}),
    }).eq('id', booking_id)
  }

  return NextResponse.json({ id: inspection.id })
}
