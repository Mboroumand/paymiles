'use client'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Car } from '@/lib/types'

const inputCls = 'w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-gray-400 placeholder:text-gray-300 transition'
const selectCls = 'w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-gray-400 disabled:opacity-40 transition'
const labelCls = 'block text-xs font-medium text-gray-500 mb-1.5'
const DELIVERY_FEE = 99
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']
const TIMES = ['6:00 AM','6:30 AM','7:00 AM','7:30 AM','8:00 AM','8:30 AM','9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM','6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM','8:30 PM','9:00 PM','9:30 PM','10:00 PM']
function timeToHours(t: string): number {
  const [time, ampm] = t.split(' ')
  let [h, m] = time.split(':').map(Number)
  if (ampm === 'PM' && h !== 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  return h + m / 60
}

const US_STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming']
const CITIES_BY_STATE: Record<string, string[]> = {
  'California':['Los Angeles','San Francisco','San Diego','San Jose','Sacramento','Oakland','Fresno','Long Beach','Bakersfield','Anaheim','Santa Ana','Riverside','Irvine','Stockton','Chula Vista','Fremont','Santa Clarita','San Bernardino','Modesto','Fontana'],
  'Texas':['Houston','San Antonio','Dallas','Austin','Fort Worth','El Paso','Arlington','Corpus Christi','Plano','Lubbock','Laredo','Irving','Garland','Frisco','McKinney','Amarillo','Grand Prairie','Brownsville','Pasadena','Mesquite'],
  'Florida':['Jacksonville','Miami','Tampa','Orlando','St. Petersburg','Hialeah','Tallahassee','Fort Lauderdale','Port St. Lucie','Cape Coral','Pembroke Pines','Hollywood','Gainesville','Miramar','Coral Springs','West Palm Beach','Clearwater','Brandon','Lakeland','Pompano Beach'],
  'New York':['New York City','Buffalo','Rochester','Yonkers','Syracuse','Albany','New Rochelle','Mount Vernon','Schenectady','Utica','White Plains','Troy','Niagara Falls','Binghamton','Long Island City','Freeport','Hempstead','Valley Stream','Commack','Levittown'],
  'Washington':['Seattle','Spokane','Tacoma','Vancouver','Bellevue','Kent','Everett','Renton','Spokane Valley','Kirkland','Bellingham','Kennewick','Federal Way','Yakima','Redmond','Marysville','Pasco','South Hill','Shoreline','Richland'],
  'Nevada':['Las Vegas','Henderson','Reno','North Las Vegas','Sparks','Carson City','Sunrise Manor','Paradise','Spring Valley','Enterprise'],
  'Arizona':['Phoenix','Tucson','Mesa','Chandler','Scottsdale','Gilbert','Tempe','Peoria','Surprise','Goodyear','Glendale','Yuma','Avondale','Flagstaff','Buckeye','Maricopa','Casa Grande','Lake Havasu City','Sierra Vista','Prescott'],
  'Illinois':['Chicago','Aurora','Joliet','Naperville','Rockford','Springfield','Elgin','Peoria','Champaign','Waukegan','Cicero','Bloomington','Arlington Heights','Evanston','Decatur','Schaumburg','Bolingbrook','Palatine','Skokie','Des Plaines'],
  'Colorado':['Denver','Colorado Springs','Aurora','Fort Collins','Lakewood','Thornton','Arvada','Westminster','Pueblo','Centennial','Boulder','Highlands Ranch','Greeley','Longmont','Loveland','Broomfield','Castle Rock','Commerce City','Parker','Northglenn'],
  'Georgia':['Atlanta','Columbus','Augusta','Savannah','Athens','Sandy Springs','Roswell','Macon','Albany','Johns Creek','Warner Robins','Alpharetta','Marietta','Smyrna','Valdosta','Brookhaven','Dunwoody','South Fulton','Peachtree City','Gainesville'],
}

function toDateStr(d: Date) { return d.toISOString().slice(0, 10) }

export default function BookingForm({ car, userId, wantsDelivery = false }: {
  car: Car & { included_miles_per_day?: number }
  userId: string
  wantsDelivery?: boolean
}) {
  const router = useRouter()
  const includedPerDay = car.included_miles_per_day ?? 30
  const today = new Date(); today.setHours(0,0,0,0)
  const todayStr = toDateStr(today)

  // Calendar state
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('10:00 AM')
  const [endTime, setEndTime] = useState('10:00 AM')
  const [selectingEnd, setSelectingEnd] = useState(false)
  const [hoverDate, setHoverDate] = useState('')

  // Availability
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set())
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set())
  const [loadingAvail, setLoadingAvail] = useState(true)

  // Form
  const [delState, setDelState] = useState('')
  const [delCity, setDelCity] = useState('')
  const [delZip, setDelZip] = useState('')
  const [delAddress, setDelAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [driverLicense, setDriverLicense] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const availableCities = CITIES_BY_STATE[delState] ?? []
  const fullDeliveryAddress = [delAddress, delCity, delZip ? `${delState} ${delZip}` : delState].filter(Boolean).join(', ')

  useEffect(() => {
    fetch(`/api/cars/${car.id}/availability`)
      .then(r => r.json())
      .then(({ blockedDates: b, bookedDates: d }) => {
        setBlockedDates(new Set(b))
        setBookedDates(new Set(d))
        setLoadingAvail(false)
      })
  }, [car.id])

  function isUnavailable(dateStr: string) {
    return blockedDates.has(dateStr) || bookedDates.has(dateStr) || dateStr < todayStr
  }

  function hasUnavailableInRange(s: string, e: string) {
    const cur = new Date(s + 'T00:00:00')
    const end = new Date(e + 'T00:00:00')
    while (cur <= end) {
      if (isUnavailable(toDateStr(cur))) return true
      cur.setDate(cur.getDate() + 1)
    }
    return false
  }

  function handleDayClick(dateStr: string) {
    if (isUnavailable(dateStr)) return
    if (!startDate || (startDate && endDate)) {
      setStartDate(dateStr); setEndDate(''); setSelectingEnd(true)
    } else {
      if (dateStr <= startDate) { setStartDate(dateStr); setEndDate(''); return }
      if (hasUnavailableInRange(startDate, dateStr)) {
        setError('Your selected range includes unavailable dates. Please choose different dates.')
        setStartDate(dateStr); setEndDate(''); return
      }
      setEndDate(dateStr); setSelectingEnd(false); setError('')
    }
  }

  function isInRange(dateStr: string) {
    const end = endDate || hoverDate
    if (!startDate || !end) return false
    const s = startDate < end ? startDate : end
    const e = startDate < end ? end : startDate
    return dateStr > s && dateStr < e
  }

  const { days, includedMiles, milesDeposit, totalDeposit } = useMemo(() => {
    if (!startDate || !endDate) return { days: 0, includedMiles: 0, milesDeposit: 0, totalDeposit: 0 }
    const startH = timeToHours(startTime)
    const endH = timeToHours(endTime)
    const startMs = new Date(startDate + 'T00:00:00').getTime() + startH * 3600000
    const endMs = new Date(endDate + 'T00:00:00').getTime() + endH * 3600000
    const ms = endMs - startMs
    if (ms <= 0) return { days: 0, includedMiles: 0, milesDeposit: 0, totalDeposit: 0 }
    const d = Math.ceil(ms / (1000 * 60 * 60 * 24))
    const m = d * includedPerDay
    const mDep = m * car.rate_per_mile
    return { days: d, includedMiles: m, milesDeposit: mDep, totalDeposit: mDep + (wantsDelivery ? DELIVERY_FEE : 0) }
  }, [startDate, endDate, startTime, endTime, includedPerDay, car.rate_per_mile, wantsDelivery])

  function buildCells() {
    const firstDay = new Date(calYear, calMonth, 1).getDay()
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
    const cells: (string | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`)
    }
    return cells
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!startDate || !endDate) { setError('Please select pickup and return dates'); return }
    if (wantsDelivery && (!delState || !delCity || !delZip || !delAddress)) {
      setError('Please complete the full delivery address'); return
    }
    setLoading(true); setError('')
    const supabase = createClient()
    const startH = timeToHours(startTime)
    const endH = timeToHours(endTime)
    const startISO = new Date(new Date(startDate + 'T00:00:00').getTime() + startH * 3600000).toISOString()
    const endISO = new Date(new Date(endDate + 'T00:00:00').getTime() + endH * 3600000).toISOString()
    const { error: err } = await supabase.from('bookings').insert({
      guest_id: userId, car_id: car.id, status: 'pending',
      start_date: startISO,
      end_date: endISO,
      rate_per_mile: car.rate_per_mile, odometer_start: car.odometer_start,
      delivery_requested: wantsDelivery,
      delivery_address: wantsDelivery ? fullDeliveryAddress : null,
      pickup_location: wantsDelivery ? fullDeliveryAddress : null,
      phone: phone || null, driver_license: driverLicense || null, notes: notes || null,
    })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/dashboard/bookings')
  }

  const cells = buildCells()

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

      {wantsDelivery && (
        <div className="bg-gray-900 text-white rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
          <span className="text-lg">🚗</span>
          <div>
            <p className="font-semibold">Delivery requested — $99 delivery fee applies</p>
            <p className="text-gray-400 text-xs">Enter the address where you'd like the car delivered.</p>
          </div>
        </div>
      )}

      {/* Date picker calendar */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {/* Selected range display */}
        <div className="grid grid-cols-2 border-b border-gray-100">
          <div className="px-4 py-3 border-r border-gray-100">
            <p className="text-xs text-gray-400 font-medium mb-0.5">PICKUP</p>
            <p className={`text-sm font-semibold ${startDate ? 'text-gray-900' : 'text-gray-300'}`}>
              {startDate ? new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date'}
            </p>
            {startDate && (
              <select value={startTime} onChange={e => setStartTime(e.target.value)}
                className="mt-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none w-full">
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-gray-400 font-medium mb-0.5">RETURN</p>
            <p className={`text-sm font-semibold ${endDate ? 'text-gray-900' : 'text-gray-300'}`}>
              {endDate ? new Date(endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : selectingEnd ? 'Select return date' : '—'}
            </p>
            {endDate && (
              <select value={endTime} onChange={e => setEndTime(e.target.value)}
                className="mt-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none w-full">
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <button type="button" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1) } else setCalMonth(m => m-1) }}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition text-lg">‹</button>
          <span className="font-semibold text-sm text-gray-900">{MONTHS[calMonth]} {calYear}</span>
          <button type="button" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1) } else setCalMonth(m => m+1) }}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition text-lg">›</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-2">
          {DAYS.map(d => <div key={d} className="text-center text-xs text-gray-400 font-medium py-2">{d}</div>)}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7 px-2 pb-3 gap-y-1">
          {cells.map((dateStr, i) => {
            if (!dateStr) return <div key={`e${i}`} />
            const unavailable = isUnavailable(dateStr)
            const isBooked = bookedDates.has(dateStr)
            const isBlocked = blockedDates.has(dateStr)
            const isPast = dateStr < todayStr
            const isStart = dateStr === startDate
            const isEnd = dateStr === endDate
            const inRange = isInRange(dateStr)
            const day = parseInt(dateStr.slice(8))

            let cls = 'relative flex items-center justify-center h-9 text-sm rounded-xl transition select-none '

            if (isStart || isEnd) cls += 'bg-gray-900 text-white font-bold cursor-pointer '
            else if (inRange) cls += 'bg-gray-100 text-gray-900 cursor-pointer '
            else if (isBooked) cls += 'bg-blue-100 text-blue-400 cursor-not-allowed '
            else if (isBlocked) cls += 'bg-red-50 text-red-300 cursor-not-allowed line-through '
            else if (isPast) cls += 'text-gray-300 cursor-default '
            else cls += 'text-gray-700 hover:bg-gray-100 cursor-pointer '

            return (
              <div key={dateStr} className={cls}
                onClick={() => handleDayClick(dateStr)}
                onMouseEnter={() => selectingEnd && setHoverDate(dateStr)}
                onMouseLeave={() => setHoverDate('')}
                title={isBooked ? 'Already booked' : isBlocked ? 'Blocked by host' : ''}
              >
                {day}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        {!loadingAvail && (
          <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-100 inline-block"/>Booked</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-50 border border-red-200 inline-block"/>Unavailable</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-900 inline-block"/>Your selection</span>
            {startDate && !endDate && <span className="text-blue-500 font-medium">Now select return date →</span>}
          </div>
        )}
        {loadingAvail && <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-100">Loading availability…</div>}
      </div>

      {/* Trip summary */}
      {days > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-800">Trip summary</p>
          <div className="space-y-1.5 text-sm">
            <Row label="Duration" value={`${days} day${days !== 1 ? 's' : ''}`} />
            <Row label={`Included miles (${includedPerDay}/day)`} value={`${includedMiles} miles`} />
            <Row label="Miles deposit" value={`$${milesDeposit.toFixed(2)}`} />
            {wantsDelivery && <Row label="Delivery fee" value={`$${DELIVERY_FEE}.00`} />}
          </div>
          <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">Total due at booking</span>
            <span className="text-lg font-bold text-gray-900">${totalDeposit.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Delivery address */}
      {wantsDelivery && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivery address *</p>
          <div>
            <label className={labelCls}>State</label>
            <select value={delState} onChange={e => { setDelState(e.target.value); setDelCity('') }} required={wantsDelivery} className={selectCls}>
              <option value="">Select state</option>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>City</label>
            {availableCities.length > 0 ? (
              <select value={delCity} onChange={e => setDelCity(e.target.value)} required={wantsDelivery} disabled={!delState} className={selectCls}>
                <option value="">Select city</option>
                {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input value={delCity} onChange={e => setDelCity(e.target.value)}
                placeholder={delState ? 'Enter city name' : 'Select a state first'}
                required={wantsDelivery} disabled={!delState} className={inputCls} />
            )}
          </div>
          <div>
            <label className={labelCls}>ZIP code</label>
            <input value={delZip} onChange={e => setDelZip(e.target.value)} placeholder="e.g. 92101" maxLength={10} required={wantsDelivery} disabled={!delCity} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Street address</label>
            <input value={delAddress} onChange={e => setDelAddress(e.target.value)} placeholder="e.g. 456 Ocean Ave" required={wantsDelivery} disabled={!delCity} className={inputCls} />
          </div>
          {delCity && delState && (
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              <span>📍</span><span>{fullDeliveryAddress}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Phone Number</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" type="tel" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Driver's License #</label>
          <input value={driverLicense} onChange={e => setDriverLicense(e.target.value)} placeholder="DL12345678" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Notes <span className="text-gray-300">(optional)</span></label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          placeholder="Any special requests or information for the host…"
          className={`${inputCls} resize-none`} />
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-gray-600 space-y-1.5">
        <p className="font-semibold text-blue-700">How billing works</p>
        <p>1. Deposit covering <strong>{includedPerDay} miles/day</strong>{wantsDelivery ? ' + $99 delivery fee' : ''} is charged at booking.</p>
        <p>2. Extra miles beyond included are billed at <strong>${car.rate_per_mile}/mi</strong> after the trip.</p>
        <p>3. Hosts are guaranteed the included miles minimum.</p>
      </div>

      <button type="submit" disabled={loading || !startDate || !endDate}
        className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white py-3.5 rounded-xl font-semibold transition text-base">
        {loading ? 'Booking…' : `Confirm & Pay${totalDeposit > 0 ? ` $${totalDeposit.toFixed(2)}` : ''}`}
      </button>
    </form>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  )
}
