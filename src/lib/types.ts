export type Role = 'guest' | 'admin' | 'host'
export type CarStatus = 'available' | 'rented' | 'maintenance'
export type ListingStatus = 'pending' | 'approved' | 'rejected'
export type BookingStatus = 'pending' | 'active' | 'completed' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'paid'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: Role
  driver_license: string | null
  created_at: string
}

export interface Car {
  id: string
  name: string
  model: string
  year: number
  color: string | null
  vin: string | null
  license_plate: string | null
  rate_per_mile: number
  status: CarStatus
  image_url: string | null
  tesla_vehicle_id: string | null
  odometer_start: number | null
  listing_status: ListingStatus
  host_id: string | null
  created_at: string
}

export interface Booking {
  id: string
  guest_id: string
  car_id: string
  status: BookingStatus
  start_date: string
  end_date: string | null
  odometer_start: number | null
  odometer_end: number | null
  miles_driven: number | null
  rate_per_mile: number
  total_amount: number | null
  payment_status: PaymentStatus
  notes: string | null
  created_at: string
  car?: Car
  guest?: Profile
}
