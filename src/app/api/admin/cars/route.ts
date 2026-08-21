import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

export async function POST(req: NextRequest) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { error, data } = await adminClient.from('cars').insert({
    name: `Tesla ${body.model}`,
    model: body.model,
    year: parseInt(body.year),
    color: body.color || null,
    license_plate: body.license_plate || null,
    rate_per_mile: parseFloat(body.rate_per_mile),
    included_miles_per_day: parseInt(body.included_miles_per_day) || 30,
    odometer_start: body.odometer_start ? parseFloat(body.odometer_start) : null,
    location: body.location || null,
    image_url: body.image_url || null,
    tesla_vehicle_id: body.tesla_vehicle_id || null,
    listing_status: 'approved',
    status: 'available',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ car: data })
}

export async function PATCH(req: NextRequest) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { id, ...fields } = body

  const update: Record<string, any> = {}
  if (fields.model) { update.model = fields.model; update.name = `Tesla ${fields.model}` }
  if (fields.year) update.year = parseInt(fields.year)
  if ('color' in fields) update.color = fields.color || null
  if ('license_plate' in fields) update.license_plate = fields.license_plate || null
  if (fields.rate_per_mile) update.rate_per_mile = parseFloat(fields.rate_per_mile)
  if (fields.included_miles_per_day) update.included_miles_per_day = parseInt(fields.included_miles_per_day)
  if ('odometer_start' in fields) update.odometer_start = fields.odometer_start ? parseFloat(fields.odometer_start) : null
  if ('location' in fields) update.location = fields.location || null
  if ('image_url' in fields) update.image_url = fields.image_url || null
  if ('tesla_vehicle_id' in fields) update.tesla_vehicle_id = fields.tesla_vehicle_id || null
  if ('listing_status' in fields) update.listing_status = fields.listing_status

  const { error } = await adminClient.from('cars').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
