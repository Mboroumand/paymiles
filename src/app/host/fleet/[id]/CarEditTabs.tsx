'use client'
import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { updateCarPhoto, updateCarDetails, toggleVehicleActive, addCarPhoto, deleteCarPhoto, setMainPhoto, linkTeslaVehicle, toggleFsd } from './actions'

const TESLA_MODELS = ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck', 'Roadster']
const COLORS = ['Black', 'White', 'Silver', 'Red', 'Blue', 'Gray', 'Pearl White', 'Midnight Silver', 'Deep Blue', 'Ultra Red']

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

function parseLocation(loc: string | null) {
  if (!loc) return { locState: '', locCity: '', locAddress: '', locZip: '' }
  const parts = loc.split(', ')
  const lastPart = parts[parts.length - 1] ?? ''
  // Check if last part ends with a zip code: "California 94102" or "CA 94102"
  const zipMatch = lastPart.match(/^(.+?)\s+(\d{5}(?:-\d{4})?)$/)
  const statePart = zipMatch ? zipMatch[1] : lastPart
  const zip = zipMatch ? zipMatch[2] : ''
  if (parts.length >= 3) return { locState: statePart, locCity: parts[parts.length - 2], locAddress: parts.slice(0, -2).join(', '), locZip: zip }
  if (parts.length === 2) return { locState: statePart, locCity: parts[0], locAddress: '', locZip: zip }
  return { locState: '', locCity: parts[0] ?? '', locAddress: '', locZip: '' }
}

function NavLink({ tab, label, carId }: { tab: string; label: string; carId: string }) {
  const searchParams = useSearchParams()
  const active = (searchParams.get('tab') ?? 'pricing') === tab
  return (
    <Link
      href={`/host/fleet/${carId}?tab=${tab}`}
      className={`block px-3 py-2 rounded-lg text-sm transition ${active ? 'bg-gray-900 text-white font-medium' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
    >
      {label}
    </Link>
  )
}

export default function CarEditTabs({ car, hostId, photos: initialPhotos }: { car: any; hostId: string; photos: any[] }) {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'pricing'
  const teslaStatus = searchParams.get('tesla')
  const teslaError = searchParams.get('tesla_error')
  const router = useRouter()

  // After Tesla OAuth redirect, refresh server data then strip the query param
  useEffect(() => {
    if (teslaStatus === 'connected') {
      router.refresh()
      router.replace(`/host/fleet/${car.id}?tab=details`)
    }
  }, [teslaStatus])

  // Pricing state
  const [rate, setRate] = useState(car.rate_per_mile?.toString() ?? '')
  const [includedMilesPerDay, setIncludedMilesPerDay] = useState(car.included_miles_per_day?.toString() ?? '30')
  const [savingRate, setSavingRate] = useState(false)
  const [rateMsg, setRateMsg] = useState('')

  // Details state
  const [details, setDetails] = useState({
    model: car.model ?? '',
    year: car.year?.toString() ?? '',
    color: car.color ?? '',
    license_plate: car.license_plate ?? '',
    odometer_start: car.odometer_start?.toString() ?? '',
  })
  const parsed = parseLocation(car.location ?? null)
  const [locState, setLocState] = useState(parsed.locState)
  const [locCity, setLocCity] = useState(parsed.locCity)
  const [locAddress, setLocAddress] = useState(parsed.locAddress)
  const [locZip, setLocZip] = useState(parsed.locZip)
  const [hasFsd, setHasFsd] = useState(car.has_fsd ?? false)
  const [fsdSaving, setFsdSaving] = useState(false)
  const [savingDetails, setSavingDetails] = useState(false)
  const [detailsMsg, setDetailsMsg] = useState('')
  const [readingOdometer, setReadingOdometer] = useState(false)
  const [odometerMsg, setOdometerMsg] = useState('')

  // Photos state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<any[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [photoMsg, setPhotoMsg] = useState('')

  // Active toggle
  const [isActive, setIsActive] = useState(car.is_active ?? true)
  const [toggling, setToggling] = useState(false)

  async function saveRate(e: React.FormEvent) {
    e.preventDefault()
    setSavingRate(true)
    setRateMsg('')
    const result = await updateCarDetails(car.id, { rate_per_mile: parseFloat(rate), included_miles_per_day: parseInt(includedMilesPerDay) || 30 })
    setRateMsg(result?.error ? result.error : 'Saved!')
    setSavingRate(false)
    setTimeout(() => setRateMsg(''), 3000)
  }

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault()
    setSavingDetails(true)
    setDetailsMsg('')
    const result = await updateCarDetails(car.id, {
      model: details.model,
      year: parseInt(details.year),
      color: details.color || null,
      license_plate: details.license_plate || null,
      odometer_start: details.odometer_start ? parseFloat(details.odometer_start) : null,
      location: [locAddress, locCity, locZip ? `${locState} ${locZip}` : locState].filter(Boolean).join(', ') || null,
      name: `Tesla ${details.model}`,
    })
    setDetailsMsg(result?.error ? result.error : 'Saved!')
    setSavingDetails(false)
    setTimeout(() => setDetailsMsg(''), 3000)
    if (!result?.error) router.refresh()
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (photos.length >= 5) { setPhotoMsg('Maximum 5 photos allowed'); return }
    if (file.size > 5 * 1024 * 1024) { setPhotoMsg('Photo must be under 5MB'); return }
    setUploading(true)
    setPhotoMsg('')
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${hostId}/${car.id}-${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('car-images').upload(path, file, { upsert: true })
    if (uploadErr) { setPhotoMsg('Upload failed: ' + uploadErr.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('car-images').getPublicUrl(path)
    const result = await addCarPhoto(car.id, publicUrl, photos.length === 0)
    if (result?.error) { setPhotoMsg(result.error); setUploading(false); return }
    setPhotoMsg('Photo added!')
    setUploading(false)
    router.refresh()
    setTimeout(() => setPhotoMsg(''), 3000)
  }

  async function handleDeletePhoto(photoId: string, wasPrimary: boolean) {
    const result = await deleteCarPhoto(photoId, car.id, wasPrimary)
    if (result?.error) { setPhotoMsg(result.error); return }
    setPhotos(p => p.filter(x => x.id !== photoId))
    router.refresh()
  }

  async function handleSetMain(photoId: string, url: string) {
    const result = await setMainPhoto(photoId, car.id, url)
    if (result?.error) { setPhotoMsg(result.error); return }
    setPhotos(p => p.map(x => ({ ...x, is_primary: x.id === photoId })))
    setPhotoMsg('Main photo updated!')
    setTimeout(() => setPhotoMsg(''), 3000)
    router.refresh()
  }

  async function readOdometer() {
    setReadingOdometer(true)
    setOdometerMsg('')
    try {
      const res = await fetch(`/api/tesla/odometer?carId=${car.id}`)
      const data = await res.json()
      if (data.odometer) {
        setDetails(d => ({ ...d, odometer_start: Math.round(data.odometer).toString() }))
        setOdometerMsg(`✓ Read ${Math.round(data.odometer).toLocaleString()} mi from Tesla`)
      } else if (data.asleep) {
        setOdometerMsg('Car is asleep — try again in 30 seconds')
      } else {
        setOdometerMsg(data.error ?? 'Could not read odometer')
      }
    } catch {
      setOdometerMsg('Network error')
    }
    setReadingOdometer(false)
    setTimeout(() => setOdometerMsg(''), 5000)
  }

  async function handleToggle() {
    setToggling(true)
    const result = await toggleVehicleActive(car.id, !isActive)
    if (!result?.error) setIsActive((v: boolean) => !v)
    setToggling(false)
  }

  return (
    <div>
      {tab === 'pricing' && (
        <div>
          <h1 className="text-2xl font-bold mb-1">Pricing</h1>
          <p className="text-gray-400 text-sm mb-8">Set your per-mile rate for this vehicle.</p>

          <form onSubmit={saveRate} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Rate per mile (USD)</label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input value={rate} onChange={e => setRate(e.target.value)} type="number" step="0.01" min="0" required
                    className="w-full bg-white border border-gray-200 rounded-xl pl-7 pr-4 py-3 text-gray-900 text-lg font-bold focus:outline-none focus:border-blue-500" />
                </div>
                <span className="text-gray-500 text-sm">/mile</span>
              </div>
              <p className="text-gray-600 text-xs mt-2">Guests pay exactly this per mile driven, tracked via Tesla odometer.</p>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Included miles per day</label>
              <input value={includedMilesPerDay} onChange={e => setIncludedMilesPerDay(e.target.value)}
                type="number" min="1" max="500" required
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm font-bold focus:outline-none focus:border-blue-500" />
              <p className="text-gray-600 text-xs mt-2">Guests pay a deposit covering these miles upfront. Default: 30/day.</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={savingRate}
                className="bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-gray-100 disabled:opacity-50 transition">
                {savingRate ? 'Saving…' : 'Save rate'}
              </button>
              {rateMsg && <span className={`text-sm ${rateMsg === 'Saved!' ? 'text-green-600' : 'text-red-600'}`}>{rateMsg}</span>}
            </div>
          </form>

          {/* Active toggle */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Listing status</p>
                <p className="text-gray-400 text-sm mt-0.5">
                  {isActive ? 'Your car is visible to guests and can be booked.' : 'Your car is hidden from guests.'}
                </p>
              </div>
              {car.listing_status === 'approved' ? (
                <button onClick={handleToggle} disabled={toggling}
                  className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${isActive ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              ) : (
                <span className="text-amber-600 text-xs bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                  Awaiting admin approval
                </span>
              )}
            </div>
          </div>

          {/* FSD toggle */}
          <div className={`bg-white border rounded-2xl p-6 mt-4 transition ${hasFsd ? 'border-blue-300' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Full Self-Driving (FSD)</p>
                <p className="text-gray-400 text-sm mt-0.5">
                  {hasFsd ? 'FSD is active on this car.' : 'FSD is not enabled on this car.'}
                </p>
              </div>
              <button
                disabled={fsdSaving}
                onClick={async () => {
                  setFsdSaving(true)
                  const next = !hasFsd
                  setHasFsd(next)
                  await toggleFsd(car.id, next)
                  setFsdSaving(false)
                }}
                className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${hasFsd ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${hasFsd ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'photos' && (
        <div>
          <h1 className="text-2xl font-bold mb-1">Photos</h1>
          <p className="text-gray-400 text-sm mb-6">Up to 5 photos. Star one to set it as the main listing photo.</p>

          {photoMsg && (
            <div className={`text-sm rounded-xl px-4 py-3 mb-4 ${photoMsg.includes('!') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
              {photoMsg}
            </div>
          )}

          {/* Photo grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {photos.map(p => (
              <div key={p.id} className="relative rounded-2xl overflow-hidden group aspect-[4/3] bg-gray-100">
                <img src={p.url} alt="Car photo" className="w-full h-full object-cover" />

                {/* Primary badge */}
                {p.is_primary && (
                  <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    ★ Main
                  </div>
                )}

                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  {!p.is_primary && (
                    <button onClick={() => handleSetMain(p.id, p.url)}
                      className="bg-yellow-400 hover:bg-yellow-300 text-yellow-900 text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                      ★ Set main
                    </button>
                  )}
                  <button onClick={() => handleDeletePhoto(p.id, p.is_primary)}
                    className="bg-red-500 hover:bg-red-400 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {/* Upload slot */}
            {photos.length < 5 && (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-[4/3] rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-400 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-600 transition disabled:opacity-50">
                {uploading ? (
                  <span className="text-sm">Uploading…</span>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
                      <path d="M12 4v16m8-8H4" strokeLinecap="round" />
                    </svg>
                    <span className="text-sm font-medium">Add photo</span>
                    <span className="text-xs">{photos.length}/5</span>
                  </>
                )}
              </button>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          <p className="text-xs text-gray-400">JPG, PNG, or WEBP · Max 5MB per photo. Hover a photo to set it as main or delete it.</p>
        </div>
      )}

      {tab === 'details' && (
        <div>
          <h1 className="text-2xl font-bold mb-1">Details</h1>
          <p className="text-gray-400 text-sm mb-6">Update your car's information.</p>

          {/* Tesla status messages */}
          {teslaStatus === 'connected' && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
              ✅ Tesla connected successfully!
            </div>
          )}
          {teslaError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
              Tesla connection failed: {decodeURIComponent(teslaError)}
            </div>
          )}

          {/* Tesla connection status */}
          <div className={`rounded-2xl border p-5 mb-6 flex items-center justify-between ${car.tesla_vehicle_id ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {car.tesla_vehicle_id ? 'Tesla connected' : 'Connect your Tesla'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {car.tesla_vehicle_id
                    ? `Vehicle ID: ${car.tesla_vehicle_id}`
                    : 'Required to read odometer and track miles driven'}
                </p>
              </div>
            </div>
            <a href={`/api/tesla/connect?carId=${car.id}`}
              className={`text-sm font-semibold px-4 py-2 rounded-xl transition ${car.tesla_vehicle_id ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
              {car.tesla_vehicle_id ? 'Reconnect' : 'Connect Tesla'}
            </a>
          </div>

          <form onSubmit={saveDetails} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Tesla Model</label>
              <select value={details.model} onChange={e => setDetails(d => ({ ...d, model: e.target.value }))}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500">
                {TESLA_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Year</label>
                <select value={details.year} onChange={e => setDetails(d => ({ ...d, year: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500">
                  {Array.from({ length: 12 }, (_, i) => 2025 - i).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Color</label>
                <select value={details.color} onChange={e => setDetails(d => ({ ...d, color: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500">
                  <option value="">Select color</option>
                  {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">License Plate</label>
              <input value={details.license_plate} onChange={e => setDetails(d => ({ ...d, license_plate: e.target.value }))}
                placeholder="ABC-1234"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Current Odometer (mi)</label>
              <div className="flex gap-2">
                <input value={details.odometer_start} onChange={e => setDetails(d => ({ ...d, odometer_start: e.target.value }))}
                  type="number" placeholder="12500"
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500" />
                {car.tesla_vehicle_id && (
                  <button type="button" onClick={readOdometer} disabled={readingOdometer}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition whitespace-nowrap">
                    <span>⚡</span>
                    {readingOdometer ? 'Reading…' : 'Read from Tesla'}
                  </button>
                )}
              </div>
              {odometerMsg && (
                <p className={`text-xs mt-1.5 ${odometerMsg.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
                  {odometerMsg}
                </p>
              )}
            </div>
            {/* Location — structured */}
            <div className="space-y-2.5">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Car Location</p>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">State</label>
                <select value={locState} onChange={e => { setLocState(e.target.value); setLocCity('') }}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400">
                  <option value="">Select state</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">City</label>
                {(CITIES_BY_STATE[locState] ?? []).length > 0 ? (
                  <select value={locCity} onChange={e => setLocCity(e.target.value)} disabled={!locState}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400 disabled:opacity-40">
                    <option value="">Select city</option>
                    {CITIES_BY_STATE[locState].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <input value={locCity} onChange={e => setLocCity(e.target.value)}
                    placeholder={locState ? 'Enter city name' : 'Select a state first'}
                    disabled={!locState}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400 disabled:opacity-40 placeholder:text-gray-300" />
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Street address</label>
                <input value={locAddress} onChange={e => setLocAddress(e.target.value)}
                  placeholder="e.g. 123 Main St"
                  required
                  disabled={!locCity}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400 disabled:opacity-40 placeholder:text-gray-300" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">ZIP code</label>
                <input value={locZip} onChange={e => setLocZip(e.target.value)}
                  placeholder="e.g. 94102"
                  maxLength={10}
                  required
                  disabled={!locCity}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400 disabled:opacity-40 placeholder:text-gray-300" />
              </div>
              {locCity && locState && (
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  <span>📍</span>
                  <span>{[locAddress, locCity, locZip ? `${locState} ${locZip}` : locState].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={savingDetails}
                className="bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-gray-100 disabled:opacity-50 transition">
                {savingDetails ? 'Saving…' : 'Save details'}
              </button>
              {detailsMsg && <span className={`text-sm ${detailsMsg === 'Saved!' ? 'text-green-600' : 'text-red-600'}`}>{detailsMsg}</span>}
            </div>
          </form>
        </div>
      )}

      {tab === 'availability' && (
        <div>
          <h1 className="text-2xl font-bold mb-1">Availability</h1>
          <p className="text-gray-400 text-sm mb-8">Control when your car can be booked.</p>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Car available for booking</p>
                <p className="text-gray-400 text-sm mt-0.5">
                  {isActive ? 'Guests can request to book this car.' : 'This car is not accepting new bookings.'}
                </p>
              </div>
              {car.listing_status === 'approved' ? (
                <button onClick={handleToggle} disabled={toggling}
                  className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${isActive ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              ) : (
                <span className="text-amber-600 text-xs bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">Pending approval</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { NavLink }
