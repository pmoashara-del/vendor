-- Optional 8-digit ITS (community identification) on vendor registration
alter table public.vendor_registration
  add column if not exists its_number text;

alter table public.vendor_registration
  drop constraint if exists vendor_registration_its_number_check;

alter table public.vendor_registration
  add constraint vendor_registration_its_number_check
  check (its_number is null or its_number ~ '^\d{8}$');

comment on column public.vendor_registration.its_number is
  'Optional 8-digit ITS ID for Dawoodi Bohra community members; null for other communities.';

create index if not exists vendor_registration_its_number_idx
  on public.vendor_registration (its_number)
  where its_number is not null;
