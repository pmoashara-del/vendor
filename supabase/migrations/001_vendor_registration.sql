-- Vendor Registration Form — main table for vendor master data (Supabase / PostgreSQL)
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run

create extension if not exists "pgcrypto";

create table if not exists public.vendor_registration (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  registration_status text not null default 'pending'
    check (registration_status in ('pending', 'under_review', 'approved', 'rejected', 'on_hold')),

  -- 1. Vendor basic details
  company_name text not null,
  vendor_type text not null,
  constitution_of_business text not null,
  year_of_establishment integer,
  registered_address text not null,
  city text not null,
  state text not null,
  country text not null default 'India',
  pin_code text not null,

  -- 2. Contact details
  primary_contact_person text not null,
  contact_designation text,
  mobile_number text not null,
  alternate_mobile text,
  email text not null,
  website text,

  -- 3. Statutory / tax
  pan_number text not null,
  gst_registered boolean not null default false,
  gstin text,
  msme_registered boolean not null default false,
  msme_udyam_number text,
  tan_number text,
  tds_applicability text,
  aadhaar_linked_with_pan text not null,

  -- 4. Bank details
  bank_name text not null,
  branch_name text not null,
  account_holder_name text not null,
  account_number text not null,
  ifsc_code text not null,
  account_type text not null,

  -- 5. Product / service
  main_category text not null,
  sub_category text,
  products_services_offered text not null,
  service_location_other boolean not null default false,
  service_location_pan_india boolean not null default false,
  service_location_madhya_pradesh boolean not null default false,
  service_location_indore boolean not null default false,
  turnover_fy_2023_24 numeric,
  turnover_fy_2024_25 numeric,
  turnover_fy_2025_26 numeric,
  expected_credit_period text,

  -- 6. References
  reference_1_name text,
  reference_1_contact text,
  reference_2_name text,
  reference_2_contact text,

  -- 7. Documents checklist (acknowledgement flags; upload paths can be added later)
  doc_pan_card boolean not null default false,
  doc_cancelled_cheque boolean not null default false,
  doc_address_proof boolean not null default false,
  doc_company_registration boolean not null default false,
  doc_gst_certificate boolean not null default false,
  doc_msme_certificate boolean not null default false,
  doc_other boolean not null default false,
  doc_other_description text,

  -- 8. Policy
  policy_accepted boolean not null default false,

  -- 9. Declaration
  declaration_authorized_person_name text not null,
  declaration_designation text not null,
  declaration_date date not null,
  declaration_place text not null
);

comment on table public.vendor_registration is 'Vendor Registration Form — canonical vendor onboarding record.';

create index if not exists vendor_registration_created_at_idx
  on public.vendor_registration (created_at desc);
create index if not exists vendor_registration_status_idx
  on public.vendor_registration (registration_status);
create index if not exists vendor_registration_vendor_type_idx
  on public.vendor_registration (vendor_type);
create index if not exists vendor_registration_email_idx
  on public.vendor_registration (email);

create or replace function public.set_vendor_registration_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists vendor_registration_set_updated_at on public.vendor_registration;
create trigger vendor_registration_set_updated_at
  before update on public.vendor_registration
  for each row execute procedure public.set_vendor_registration_updated_at();

alter table public.vendor_registration enable row level security;

-- Public registration: allow anonymous INSERT only (application validates payload)
create policy "Allow anonymous insert for vendor registration"
  on public.vendor_registration
  for insert
  to anon, authenticated
  with check (true);

-- Do not expose reads to anon/authenticated by default; admin uses service role (bypasses RLS)

grant usage on schema public to anon, authenticated;
grant insert on public.vendor_registration to anon, authenticated;
