'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Car } from '@/lib/types'

const inputCls = 'w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-gray-400 placeholder:text-gray-300 transition'
const selectCls = 'w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-gray-400 disabled:opacity-40 transition'
const labelCls = 'block text-xs font-medium text-gray-500 mb-1.5'

const DELIVERY_FEE = 99

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
]

const CITIES_BY_STATE: Record<string, string[]> = {
  'California': ['Los Angeles','San Francisco','San Diego','San Jose','Sacramento','Oakland','Fresno','Long Beach','Bakersfield','Anaheim','Santa Ana','Riverside','Irvine','Stockton','Chula Vista','Fremont','Santa Clarita','San Bernardino','Modesto','Fontana'],
  'Texas': ['Houston','San Antonio','Dallas','Austin','Fort Worth','El Paso','Arlington','Corpus Christi','Plano','Lubbock','Laredo','Irving','Garland','Frisco','McKinney','Amarillo','Grand Prairie','Brownsville','Pasadena','Mesquite'],
  'Florida': ['Jacksonville','Miami','Tampa','Orlando','St. Petersburg','Hialeah','Tallahassee','Fort Lauderdale','Port St. Lucie','Cape Coral','Pembroke Pines','Hollywood','Gainesville','Miramar','Coral Springs','West Palm Beach','Clearwater','Brandon','Lakeland','Pompano Beach'],
  'New York': ['New York City','Buffalo','Rochester','Yonkers','Syracuse','Albany','New Rochelle','Mount Vernon','Schenectady','Utica','White Plains','Troy','Niagara Falls','Binghamton','Long Island City','Freeport','Hempstead','Valley Stream','Commack','Levittown'],
  'Washington': ['Seattle','Spokane','Tacoma','Vancouver','Bellevue','Kent','Everett','Renton','Spokane Valley','Kirkland','Bellingham','Kennewick','Federal Way','Yakima','Redmond','Marysville','Pasco','South Hill','Shoreline','Richland'],
  'Nevada': ['Las Vegas','Henderson','Reno','North Las Vegas','Sparks','Carson City','Sunrise Manor','Paradise','Spring Valley','Enterprise'],
  'Arizona': ['Phoenix','Tucson','Mesa','Chandler','Scottsdale','Gilbert','Tempe','Peoria','Surprise','Goodyear','Glendale','Yuma','Avondale','Flagstaff','Buckeye','Maricopa','Casa Grande','Lake Havasu City','Sierra Vista','Prescott'],
  'Illinois': ['Chicago','Aurora','Joliet','Naperville','Rockford','Springfield','Elgin','Peoria','Champaign','Waukegan','Cicero','Bloomington','Arlington Heights','Evanston','Decatur','Schaumburg','Bolingbrook','Palatine','Skokie','Des Plaines'],
  'Colorado': ['Denver','Colorado Springs','Aurora','Fort Collins','Lakewood','Thornton','Arvada','Westminster','Pueblo','Centennial','Boulder','Highlands Ranch','Greeley','Longmont','Loveland','Broomfield','Castle Rock','Commerce City','Parker','Northglenn'],
  'Georgia': ['Atlanta','Columbus','Augusta','Savannah','Athens','Sandy Springs','Roswell','Macon','Albany','Johns Creek','Warner Robins','Alpharetta','Marietta','Smyrna','Valdosta','Brookhaven','Dunwoody','South Fulton','Peachtree City','Gainesville'],
  'North Carolina': ['Charlotte','Raleigh','Greensboro','Durham','Winston-Salem','Fayetteville','Cary','Wilmington','High Point','Concord','Asheville','Gastonia','Jacksonville','Chapel Hill','Rocky Mount','Huntersville','Burlington','Wilson','Kannapolis','Apex'],
  'Michigan': ['Detroit','Grand Rapids','Warren','Sterling Heights','Ann Arbor','Lansing','Flint','Dearborn','Livonia','Westland','Troy','Southfield','Kalamazoo','Wyoming','Farmington Hills','Rochester Hills','Taylor','Pontiac','St. Clair Shores','Royal Oak'],
  'Virginia': ['Virginia Beach','Norfolk','Chesapeake','Richmond','Newport News','Alexandria','Hampton','Roanoke','Portsmouth','Suffolk','Lynchburg','Harrisonburg','Leesburg','Charlottesville','Blacksburg','Manassas','Fredericksburg','Williamsburg','Bristol','Herndon'],
  'Ohio': ['Columbus','Cleveland','Cincinnati','Toledo','Akron','Dayton','Parma','Canton','Youngstown','Lorain','Hamilton','Springfield','Kettering','Elyria','Lakewood','Cuyahoga Falls','Euclid','Middletown','Newark','Mansfield'],
  'Pennsylvania': ['Philadelphia','Pittsburgh','Allentown','Erie','Reading','Scranton','Bethlehem','Lancaster','Harrisburg','York','Altoona','Wilkes-Barre','Chester','Easton','Lebanon','McKeesport','Hazleton','New Castle','Norristown','Johnstown'],
  'New Jersey': ['Newark','Jersey City','Paterson','Elizabeth','Edison','Woodbridge','Lakewood','Toms River','Hamilton','Trenton','Clifton','Camden','Brick','Cherry Hill','Passaic','Middletown','Union City','Old Bridge','Gloucester Township','East Orange'],
  'Massachusetts': ['Boston','Worcester','Springfield','Lowell','Cambridge','New Bedford','Brockton','Quincy','Lynn','Fall River','Newton','Lawrence','Somerville','Framingham','Haverhill','Waltham','Malden','Brookline','Plymouth','Medford'],
  'Tennessee': ['Memphis','Nashville','Knoxville','Chattanooga','Clarksville','Murfreesboro','Franklin','Jackson','Johnson City','Bartlett','Hendersonville','Kingsport','Collierville','Cleveland','Smyrna','Germantown','Brentwood','Columbia','La Vergne','Gallatin'],
  'Oregon': ['Portland','Salem','Eugene','Gresham','Hillsboro','Beaverton','Bend','Medford','Springfield','Corvallis','Albany','Tigard','Lake Oswego','Keiser','Aloha','Tualatin','Grants Pass','Oregon City','McMinnville','Redmond'],
  'Maryland': ['Baltimore','Columbia','Germantown','Silver Spring','Waldorf','Frederick','Glenarden','Bethesda','Ellicott City','Dundalk','Rockville','Bowie','Gaithersburg','Hagerstown','Annapolis','College Park','Salisbury','Laurel','Greenbelt','Cumberland'],
}

export default function BookingForm({
  car, userId, wantsDelivery = false,
}: {
  car: Car & { included_miles_per_day?: number }
  userId: string
  wantsDelivery?: boolean
}) {
  const router = useRouter()
  const includedPerDay = car.included_miles_per_day ?? 30

  const [form, setForm] = useState({ startDate: '', endDate: '', phone: '', driverLicense: '', notes: '' })
  const [delState, setDelState] = useState('')
  const [delCity, setDelCity] = useState('')
  const [delZip, setDelZip] = useState('')
  const [delAddress, setDelAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const availableCities = CITIES_BY_STATE[delState] ?? []

  function update(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  const fullDeliveryAddress = [delAddress, delCity, delZip ? `${delState} ${delZip}` : delState].filter(Boolean).join(', ')

  const { days, includedMiles, milesDeposit, totalDeposit } = useMemo(() => {
    if (!form.startDate || !form.endDate) return { days: 0, includedMiles: 0, milesDeposit: 0, totalDeposit: 0 }
    const ms = new Date(form.endDate).getTime() - new Date(form.startDate).getTime()
    if (ms <= 0) return { days: 0, includedMiles: 0, milesDeposit: 0, totalDeposit: 0 }
    const d = Math.ceil(ms / (1000 * 60 * 60 * 24))
    const m = d * includedPerDay
    const mDep = m * car.rate_per_mile
    return { days: d, includedMiles: m, milesDeposit: mDep, totalDeposit: mDep + (wantsDelivery ? DELIVERY_FEE : 0) }
  }, [form.startDate, form.endDate, includedPerDay, car.rate_per_mile, wantsDelivery])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.startDate || !form.endDate) { setError('Please select both pickup and return dates'); return }
    if (wantsDelivery && (!delState || !delCity || !delZip || !delAddress)) {
      setError('Please complete the full delivery address'); return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('bookings').insert({
      guest_id: userId,
      car_id: car.id,
      status: 'pending',
      start_date: new Date(form.startDate).toISOString(),
      end_date: new Date(form.endDate).toISOString(),
      rate_per_mile: car.rate_per_mile,
      odometer_start: car.odometer_start,
      delivery_requested: wantsDelivery,
      delivery_address: wantsDelivery ? fullDeliveryAddress : null,
      pickup_location: wantsDelivery ? fullDeliveryAddress : null,
      phone: form.phone || null,
      driver_license: form.driverLicense || null,
      notes: form.notes || null,
    })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/dashboard/bookings')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Delivery banner */}
      {wantsDelivery && (
        <div className="bg-gray-900 text-white rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
          <span className="text-lg">🚗</span>
          <div>
            <p className="font-semibold">Delivery requested — $99 delivery fee applies</p>
            <p className="text-gray-400 text-xs">Enter the address where you'd like the car delivered.</p>
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Pickup Date & Time *</label>
          <input type="datetime-local" value={form.startDate} onChange={update('startDate')} required
            min={new Date().toISOString().slice(0, 16)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Return Date & Time *</label>
          <input type="datetime-local" value={form.endDate} onChange={update('endDate')} required
            min={form.startDate || new Date().toISOString().slice(0, 16)} className={inputCls} />
        </div>
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
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700">Total due at booking</span>
              <span className="text-lg font-bold text-gray-900">${totalDeposit.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Extra miles billed at ${car.rate_per_mile}/mi after trip ends.
            </p>
          </div>
        </div>
      )}

      {/* Delivery address — structured */}
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
            <input value={delZip} onChange={e => setDelZip(e.target.value)}
              placeholder="e.g. 92101" maxLength={10} required={wantsDelivery} disabled={!delCity} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Street address</label>
            <input value={delAddress} onChange={e => setDelAddress(e.target.value)}
              placeholder="e.g. 456 Ocean Ave" required={wantsDelivery} disabled={!delCity} className={inputCls} />
          </div>

          {delCity && delState && (
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              <span>📍</span>
              <span>{fullDeliveryAddress}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Phone Number</label>
          <input value={form.phone} onChange={update('phone')} placeholder="+1 (555) 000-0000" type="tel" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Driver's License #</label>
          <input value={form.driverLicense} onChange={update('driverLicense')} placeholder="DL12345678" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Notes <span className="text-gray-300">(optional)</span></label>
        <textarea value={form.notes} onChange={update('notes')} rows={3}
          placeholder="Any special requests or information for the host…"
          className={`${inputCls} resize-none`} />
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-gray-600 space-y-1.5">
        <p className="font-semibold text-blue-700">How billing works</p>
        <p>1. Deposit covering <strong>{includedPerDay} miles/day</strong>{wantsDelivery ? ' + $99 delivery fee' : ''} is charged at booking.</p>
        <p>2. Extra miles beyond included are billed at <strong>${car.rate_per_mile}/mi</strong> after the trip.</p>
        <p>3. Hosts are guaranteed the included miles minimum regardless of actual use.</p>
      </div>

      <button type="submit" disabled={loading}
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
