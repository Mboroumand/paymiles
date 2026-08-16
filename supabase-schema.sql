-- Paymiles Car Rental Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  phone text,
  role text not null default 'guest' check (role in ('guest', 'admin')),
  driver_license text,
  created_at timestamptz default now()
);

-- Cars
create table cars (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  model text not null,
  year int not null,
  color text,
  vin text unique,
  license_plate text,
  rate_per_mile numeric(8,2) not null,
  status text not null default 'available' check (status in ('available', 'rented', 'maintenance')),
  image_url text,
  tesla_vehicle_id text,  -- Tesla Fleet API vehicle ID
  odometer_start numeric(10,2),
  created_at timestamptz default now()
);

-- Bookings
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  guest_id uuid references profiles(id) on delete set null,
  car_id uuid references cars(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'active', 'completed', 'cancelled')),
  start_date timestamptz not null,
  end_date timestamptz,
  odometer_start numeric(10,2),
  odometer_end numeric(10,2),
  miles_driven numeric(10,2) generated always as (
    case when odometer_end is not null then odometer_end - odometer_start else null end
  ) stored,
  rate_per_mile numeric(8,2) not null,
  total_amount numeric(10,2) generated always as (
    case when odometer_end is not null then (odometer_end - odometer_start) * rate_per_mile else null end
  ) stored,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid')),
  notes text,
  created_at timestamptz default now()
);

-- Tesla tokens per car (stored encrypted ideally, simplified here)
create table tesla_tokens (
  id uuid primary key default uuid_generate_v4(),
  car_id uuid references cars(id) on delete cascade unique,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  updated_at timestamptz default now()
);

-- RLS Policies
alter table profiles enable row level security;
alter table cars enable row level security;
alter table bookings enable row level security;
alter table tesla_tokens enable row level security;

-- Profiles: users see own, admins see all
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Cars: everyone can view available cars
create policy "Anyone can view cars" on cars for select using (true);
create policy "Admins can manage cars" on cars for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Bookings: guests see own, admins see all
create policy "Guests see own bookings" on bookings for select using (guest_id = auth.uid());
create policy "Guests can create bookings" on bookings for insert with check (guest_id = auth.uid());
create policy "Admins can manage all bookings" on bookings for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Tesla tokens: admins only
create policy "Admins manage tesla tokens" on tesla_tokens for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
