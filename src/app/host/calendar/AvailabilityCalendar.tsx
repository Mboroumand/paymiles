'use client'
import { useState, useCallback } from 'react'
import { toggleBlockedDate } from './actions'

interface Car { id: string; name: string; image_url: string | null; listing_status: string }
interface BlockedDate { id: string; car_id: string; date: string; is_blocked: boolean }
interface Booking { car_id: string; start_date: string; end_date: string; status: string }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

function eachDay(start: string, end: string): string[] {
  const days: string[] = []
  const cur = new Date(start + 'T00:00:00')
  const last = new Date(end + 'T00:00:00')
  while (cur <= last) {
    days.push(toDateStr(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

export default function AvailabilityCalendar({ cars, initialBlocked, bookings }: {
  cars: Car[]
  initialBlocked: BlockedDate[]
  bookings: Booking[]
}) {
  const [selectedCarId, setSelectedCarId] = useState(cars[0]?.id ?? '')
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [blocked, setBlocked] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    for (const b of initialBlocked) map[`${b.car_id}:${b.date}`] = b.is_blocked
    return map
  })
  const [toggling, setToggling] = useState<string | null>(null)

  // Build booked days set for selected car
  const bookedDays = new Set<string>()
  for (const b of bookings) {
    if (b.car_id !== selectedCarId) continue
    if (!b.start_date || !b.end_date) continue
    for (const d of eachDay(b.start_date.slice(0, 10), b.end_date.slice(0, 10))) {
      bookedDays.add(d)
    }
  }

  const todayStr = toDateStr(today)

  function buildCalendarDays() {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
  }

  async function handleDayClick(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (dateStr < todayStr) return // can't edit past
    if (bookedDays.has(dateStr)) return // can't unblock booked day

    const key = `${selectedCarId}:${dateStr}`
    const isCurrentlyBlocked = blocked[key] ?? false
    setToggling(dateStr)

    const newState = !isCurrentlyBlocked
    setBlocked(prev => ({ ...prev, [key]: newState }))

    await toggleBlockedDate(selectedCarId, dateStr, newState)
    setToggling(null)
  }

  // Handle range select — click + drag would be complex, instead support shift-click for range
  const [rangeStart, setRangeStart] = useState<string | null>(null)

  async function handleDayMouseDown(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (dateStr < todayStr || bookedDays.has(dateStr)) return
    setRangeStart(dateStr)
  }

  async function handleDayMouseUp(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (!rangeStart || dateStr < todayStr) { setRangeStart(null); return }

    const start = rangeStart < dateStr ? rangeStart : dateStr
    const end = rangeStart < dateStr ? dateStr : rangeStart
    const days = eachDay(start, end).filter(d => !bookedDays.has(d))

    const key0 = `${selectedCarId}:${rangeStart}`
    const newBlockedState = !(blocked[key0] ?? false)

    const updates: Record<string, boolean> = {}
    for (const d of days) updates[`${selectedCarId}:${d}`] = newBlockedState
    setBlocked(prev => ({ ...prev, ...updates }))

    await Promise.all(days.map(d => toggleBlockedDate(selectedCarId, d, newBlockedState)))
    setRangeStart(null)
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const cells = buildCalendarDays()
  const selectedCar = cars.find(c => c.id === selectedCarId)

  return (
    <div className="space-y-6">
      {/* Car selector */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {cars.map(car => (
          <button key={car.id} onClick={() => setSelectedCarId(car.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition flex-shrink-0 ${selectedCarId === car.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'}`}>
            {car.image_url
              ? <img src={car.image_url} alt={car.name} className="w-10 h-7 rounded-lg object-cover" />
              : <div className="w-10 h-7 rounded-lg bg-gray-200 flex items-center justify-center text-sm">🚗</div>
            }
            <span className="text-sm font-medium">{car.name}</span>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-gray-500">
        <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-white border border-gray-200 inline-block" />Available</div>
        <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-gray-800 inline-block" />Blocked</div>
        <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-blue-500 inline-block" />Booked</div>
        <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-gray-100 border border-dashed border-gray-300 inline-block" />Past</div>
      </div>

      {/* Calendar */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Month header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-600">
            ‹
          </button>
          <h2 className="text-lg font-bold text-gray-900">{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-600">
            ›
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-3">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 select-none">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="aspect-square" />

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isPast = dateStr < todayStr
            const isToday = dateStr === todayStr
            const isBooked = bookedDays.has(dateStr)
            const isBlocked = !isBooked && (blocked[`${selectedCarId}:${dateStr}`] ?? false)
            const isToggling = toggling === dateStr

            let bg = 'bg-white hover:bg-gray-50'
            let textColor = 'text-gray-900'
            let cursor = 'cursor-pointer'

            if (isPast) { bg = 'bg-gray-50'; textColor = 'text-gray-300'; cursor = 'cursor-default' }
            else if (isBooked) { bg = 'bg-blue-500'; textColor = 'text-white'; cursor = 'cursor-not-allowed' }
            else if (isBlocked) { bg = 'bg-gray-800 hover:bg-gray-700'; textColor = 'text-white' }

            return (
              <div
                key={dateStr}
                onMouseDown={() => handleDayMouseDown(day)}
                onMouseUp={() => handleDayMouseUp(day)}
                onClick={() => handleDayClick(day)}
                className={`aspect-square flex flex-col items-center justify-center border border-gray-50 transition ${bg} ${cursor} ${isToggling ? 'opacity-50' : ''}`}
              >
                <span className={`text-sm font-medium ${textColor} ${isToday ? 'underline underline-offset-2' : ''}`}>
                  {day}
                </span>
                {isBooked && <span className="text-[9px] text-blue-100 mt-0.5">Booked</span>}
                {isBlocked && !isBooked && <span className="text-[9px] text-gray-400 mt-0.5">Blocked</span>}
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-xs text-gray-400">Click a day to block/unblock it. Click and drag to select a range.</p>
    </div>
  )
}
