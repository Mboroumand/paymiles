'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

const selectCls = 'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 disabled:opacity-40'
const inputCls = 'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 placeholder:text-gray-400'
const labelCls = 'block text-xs text-gray-500 mb-1'

export default function SubmitCarForm({ hostId }: { hostId: string }) {
  const router = useRouter()
  const [form, setForm] = useState({
    model: '', year: '', color: '', license_plate: '', rate_per_mile: '', odometer_start: '', included_miles_per_day: '30',
  })
  const [locState, setLocState] = useState('')
  const [locCity, setLocCity] = useState('')
  const [locAddress, setLocAddress] = useState('')
  const [locZip, setLocZip] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const availableCities = CITIES_BY_STATE[locState] ?? []

  function update(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5MB'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function buildLocation() {
    const stateZip = locZip ? `${locState} ${locZip}` : locState
    return [locAddress, locCity, stateZip].filter(Boolean).join(', ')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.model) { setError('Please select a Tesla model'); return }
    if (!locState || !locCity) { setError('Please select a state and city'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()

    let image_url: string | null = null
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${hostId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('car-images').upload(path, imageFile, { upsert: true })
      if (uploadError) { setError('Image upload failed: ' + uploadError.message); setLoading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('car-images').getPublicUrl(path)
      image_url = publicUrl
    }

    const { error: err } = await supabase.from('cars').insert({
      name: `Tesla ${form.model}`,
      model: form.model,
      year: parseInt(form.year),
      color: form.color || null,
      license_plate: form.license_plate || null,
      rate_per_mile: parseFloat(form.rate_per_mile),
      included_miles_per_day: parseInt(form.included_miles_per_day) || 30,
      odometer_start: form.odometer_start ? parseFloat(form.odometer_start) : null,
      location: buildLocation(),
      image_url,
      host_id: hostId,
      listing_status: 'pending',
      status: 'available',
    })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/host')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>
      )}

      {/* Image upload */}
      <div>
        <label className={labelCls}>Car Photo</label>
        <label className="cursor-pointer block">
          <div className={`border-2 border-dashed rounded-xl overflow-hidden transition ${imagePreview ? 'border-blue-500/40' : 'border-gray-200 hover:border-gray-400'}`}>
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-gray-400 gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="text-sm">Click to upload photo</span>
                <span className="text-xs">JPG, PNG, WEBP</span>
              </div>
            )}
          </div>
          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        </label>
        {imagePreview && (
          <button type="button" onClick={() => { setImageFile(null); setImagePreview(null) }}
            className="text-xs text-red-400 hover:underline mt-1">Remove photo</button>
        )}
      </div>

      {/* Tesla Model */}
      <div>
        <label className={labelCls}>Tesla Model *</label>
        <select value={form.model} onChange={update('model')} required className={selectCls}>
          <option value="">Select a model</option>
          {TESLA_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Year */}
      <div>
        <label className={labelCls}>Year *</label>
        <select value={form.year} onChange={update('year')} required className={selectCls}>
          <option value="">Select year</option>
          {Array.from({ length: 12 }, (_, i) => 2025 - i).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Color */}
      <div>
        <label className={labelCls}>Color</label>
        <select value={form.color} onChange={update('color')} className={selectCls}>
          <option value="">Select color</option>
          {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Rate */}
      <div>
        <label className={labelCls}>Rate per Mile ($) *</label>
        <input value={form.rate_per_mile} onChange={update('rate_per_mile')} placeholder="0.35" required type="number" step="0.01" min="0"
          className={inputCls} />
      </div>

      {/* Included miles per day */}
      <div>
        <label className={labelCls}>Included miles per day *</label>
        <input value={form.included_miles_per_day} onChange={update('included_miles_per_day')} required type="number" min="1" max="500"
          className={inputCls} />
        <p className="text-xs text-gray-400 mt-1">Guests are charged a deposit for these miles upfront. Default: 30 miles/day.</p>
      </div>

      {/* License Plate */}
      <div>
        <label className={labelCls}>License Plate</label>
        <input value={form.license_plate} onChange={update('license_plate')} placeholder="ABC-1234" className={inputCls} />
      </div>

      {/* Odometer */}
      <div>
        <label className={labelCls}>Current Odometer (mi)</label>
        <input value={form.odometer_start} onChange={update('odometer_start')} placeholder="12500" type="number" className={inputCls} />
      </div>

      {/* Location — structured */}
      <div className="space-y-2.5">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider pt-1">Car Location *</p>

        {/* State */}
        <div>
          <label className={labelCls}>State</label>
          <select
            value={locState}
            onChange={e => { setLocState(e.target.value); setLocCity('') }}
            required
            className={selectCls}
          >
            <option value="">Select state</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* City */}
        <div>
          <label className={labelCls}>City</label>
          {availableCities.length > 0 ? (
            <select
              value={locCity}
              onChange={e => setLocCity(e.target.value)}
              required
              disabled={!locState}
              className={selectCls}
            >
              <option value="">Select city</option>
              {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <input
              value={locCity}
              onChange={e => setLocCity(e.target.value)}
              placeholder={locState ? 'Enter city name' : 'Select a state first'}
              required
              disabled={!locState}
              className={inputCls}
            />
          )}
        </div>

        {/* Zip code */}
        <div>
          <label className={labelCls}>ZIP code</label>
          <input
            value={locZip}
            onChange={e => setLocZip(e.target.value)}
            placeholder="e.g. 94102"
            maxLength={10}
            required
            disabled={!locCity}
            className={inputCls}
          />
        </div>

        {/* Specific address / area */}
        <div>
          <label className={labelCls}>Street address</label>
          <input
            value={locAddress}
            onChange={e => setLocAddress(e.target.value)}
            placeholder="e.g. 123 Main St"
            required
            disabled={!locCity}
            className={inputCls}
          />
        </div>

        {/* Preview */}
        {locCity && locState && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            <span>📍</span>
            <span>{buildLocation()}</span>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-lg px-3 py-2">
        After submitting, your car will be reviewed by an admin before going live.
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition">
        {loading ? 'Submitting…' : 'Submit for Approval'}
      </button>
    </form>
  )
}
