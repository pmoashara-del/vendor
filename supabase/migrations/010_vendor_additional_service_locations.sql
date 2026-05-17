-- Optional free-text list of further supply locations beyond core Indore / MP coverage.

alter table public.vendor_registration
  add column if not exists additional_service_locations text;

comment on column public.vendor_registration.additional_service_locations is
  'Optional: other cities, districts, or regions the vendor can supply; service_location_other is true when this is non-empty.';
