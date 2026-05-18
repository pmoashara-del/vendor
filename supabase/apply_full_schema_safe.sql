-- =============================================================================
-- Vendor portal — full schema (safe / idempotent)
-- =============================================================================
-- Run once in: Supabase Dashboard → SQL Editor → New query → Run
--
-- • Safe to re-run: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS only
-- • Does NOT drop tables, truncate, or delete rows
-- • Consolidates migrations 001–013 (skips 006 trigger fix — included here)
--
-- After running, scroll to "VERIFICATION" at the bottom and confirm all columns
-- show as present. If any show MISSING, re-run this script (it is idempotent).
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Shared trigger functions
-- -----------------------------------------------------------------------------
create or replace function public.set_vendor_registration_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_expression_of_interest_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- vendor_registration (base table — only created if missing)
-- -----------------------------------------------------------------------------
create table if not exists public.vendor_registration (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  registration_status text not null default 'pending'
    check (registration_status in ('pending', 'under_review', 'approved', 'rejected', 'on_hold')),

  company_name text not null,
  vendor_type text not null,
  constitution_of_business text not null,
  year_of_establishment integer,
  registered_address text not null,
  city text not null,
  state text not null,
  country text not null default 'India',
  pin_code text not null,

  primary_contact_person text not null,
  contact_designation text,
  mobile_number text not null,
  alternate_mobile text,
  email text not null,
  website text,

  pan_number text not null,
  gst_registered boolean not null default false,
  gstin text,
  msme_registered boolean not null default false,
  msme_udyam_number text,
  tan_number text,
  tds_applicability text,
  aadhaar_linked_with_pan text not null,

  bank_name text not null,
  branch_name text not null,
  account_holder_name text not null,
  account_number text not null,
  ifsc_code text not null,
  account_type text not null,

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

  reference_1_name text,
  reference_1_contact text,
  reference_2_name text,
  reference_2_contact text,

  doc_pan_card boolean not null default false,
  doc_cancelled_cheque boolean not null default false,
  doc_address_proof boolean not null default false,
  doc_company_registration boolean not null default false,
  doc_gst_certificate boolean not null default false,
  doc_msme_certificate boolean not null default false,
  doc_other boolean not null default false,
  doc_other_description text,

  policy_accepted boolean not null default false,

  declaration_authorized_person_name text not null,
  declaration_designation text not null,
  declaration_date date not null,
  declaration_place text not null
);

-- Extra vendor columns (003, 005, 010, 012) — eoi_id added after expression_of_interest exists
alter table public.vendor_registration
  add column if not exists its_number text;

alter table public.vendor_registration
  add column if not exists additional_service_locations text;

alter table public.vendor_registration
  add column if not exists category_selections jsonb default '[]'::jsonb;

update public.vendor_registration
set category_selections = '[]'::jsonb
where category_selections is null;

alter table public.vendor_registration
  alter column category_selections set default '[]'::jsonb;

-- Backfill category_selections from legacy main/sub (012) — only empty arrays
update public.vendor_registration
set category_selections = jsonb_build_array(
  jsonb_build_object('main', btrim(main_category), 'sub', btrim(sub_category))
)
where category_selections = '[]'::jsonb
  and sub_category is not null
  and btrim(sub_category) <> ''
  and main_category is not null
  and btrim(main_category) <> '';

-- -----------------------------------------------------------------------------
-- expression_of_interest (base table — only created if missing)
-- -----------------------------------------------------------------------------
create table if not exists public.expression_of_interest (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  reference_number text not null unique,

  eoi_status text not null default 'submitted'
    check (eoi_status in (
      'submitted',
      'shortlisted',
      'meeting_invited',
      'invited_to_register',
      'declined',
      'registered'
    )),

  business_name text not null,
  entity_type text not null,
  year_established integer not null,
  business_address text not null,

  contact_person_name text not null,
  contact_role text,
  mobile text not null,
  email text not null,

  primary_category text not null,
  departments_served jsonb not null default '[]'::jsonb,
  zones jsonb not null default '[]'::jsonb,
  experience_years text not null,
  turnover_range text,
  capability_description text not null,
  previous_work text,

  pan_number text not null,
  gst_number text,
  gst_status text not null,
  msme_status text,
  certifications text,
  source text,

  declaration_accepted boolean not null default false,

  meeting_invite_sent_at timestamptz,
  registration_token_hash text,
  registration_token_expires_at timestamptz,
  registration_token_used_at timestamptz,

  vendor_registration_id uuid references public.vendor_registration (id)
);

-- Extra EOI columns (004, 007, 008, 009, 011, 013) — required for EOI submit + eoi-by-reference API
alter table public.expression_of_interest
  add column if not exists its_number text;

alter table public.expression_of_interest
  add column if not exists business_city text;

alter table public.expression_of_interest
  add column if not exists business_state text;

alter table public.expression_of_interest
  add column if not exists can_work_in_programme_location text;

alter table public.expression_of_interest
  add column if not exists main_category text;

alter table public.expression_of_interest
  add column if not exists category_selections jsonb default '[]'::jsonb;

alter table public.expression_of_interest
  add column if not exists also_supplies_other_locations text;

alter table public.expression_of_interest
  add column if not exists other_supply_locations_detail text;

-- Defaults / backfills (no row deletion)
update public.expression_of_interest
set category_selections = '[]'::jsonb
where category_selections is null;

update public.expression_of_interest
set also_supplies_other_locations = 'No'
where also_supplies_other_locations is null;

alter table public.expression_of_interest
  alter column category_selections set default '[]'::jsonb;

alter table public.expression_of_interest
  alter column also_supplies_other_locations set default 'No';

-- Backfill category_selections from legacy main/primary (011)
update public.expression_of_interest
set category_selections = jsonb_build_array(
  jsonb_build_object('main', btrim(main_category), 'sub', btrim(primary_category))
)
where (category_selections = '[]'::jsonb or category_selections is null)
  and main_category is not null
  and btrim(main_category) <> ''
  and primary_category is not null
  and btrim(primary_category) <> '';

-- Backfill main_category summary from primary_category when missing (009)
update public.expression_of_interest
set main_category = btrim(split_part(primary_category, ' — ', 1))
where main_category is null
  and primary_category is not null
  and btrim(primary_category) <> ''
  and position(' — ' in primary_category) > 0;

update public.expression_of_interest
set main_category = btrim(primary_category)
where main_category is null
  and primary_category is not null
  and btrim(primary_category) <> '';

-- Link vendor → EOI (002) — must run after expression_of_interest exists
alter table public.vendor_registration
  add column if not exists eoi_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vendor_registration_eoi_id_fkey'
  ) then
    alter table public.vendor_registration
      add constraint vendor_registration_eoi_id_fkey
      foreign key (eoi_id) references public.expression_of_interest (id);
  end if;
exception
  when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- Constraints (re-apply safely)
-- -----------------------------------------------------------------------------
alter table public.vendor_registration
  drop constraint if exists vendor_registration_its_number_check;

alter table public.vendor_registration
  add constraint vendor_registration_its_number_check
  check (its_number is null or its_number ~ '^\d{8}$');

alter table public.vendor_registration
  drop constraint if exists vendor_registration_aadhaar_linked_check;

alter table public.vendor_registration
  add constraint vendor_registration_aadhaar_linked_check
  check (aadhaar_linked_with_pan in ('yes', 'no', 'unknown'));

alter table public.expression_of_interest
  drop constraint if exists expression_of_interest_its_number_check;

alter table public.expression_of_interest
  add constraint expression_of_interest_its_number_check
  check (its_number is null or its_number ~ '^\d{8}$');

alter table public.expression_of_interest
  drop constraint if exists expression_of_interest_also_supplies_other_locations_check;

alter table public.expression_of_interest
  add constraint expression_of_interest_also_supplies_other_locations_check
  check (also_supplies_other_locations is null or also_supplies_other_locations in ('Yes', 'No'));

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
create index if not exists vendor_registration_created_at_idx
  on public.vendor_registration (created_at desc);

create index if not exists vendor_registration_status_idx
  on public.vendor_registration (registration_status);

create index if not exists vendor_registration_vendor_type_idx
  on public.vendor_registration (vendor_type);

create index if not exists vendor_registration_email_idx
  on public.vendor_registration (email);

create index if not exists vendor_registration_eoi_id_idx
  on public.vendor_registration (eoi_id)
  where eoi_id is not null;

create index if not exists vendor_registration_its_number_idx
  on public.vendor_registration (its_number)
  where its_number is not null;

create index if not exists vendor_registration_status_created_idx
  on public.vendor_registration (registration_status, created_at desc);

create index if not exists vendor_registration_lower_email_idx
  on public.vendor_registration (lower(email));

create index if not exists eoi_created_at_idx
  on public.expression_of_interest (created_at desc);

create index if not exists eoi_status_idx
  on public.expression_of_interest (eoi_status);

create index if not exists eoi_email_idx
  on public.expression_of_interest (lower(email));

create index if not exists eoi_category_idx
  on public.expression_of_interest (primary_category);

create index if not exists eoi_mobile_idx
  on public.expression_of_interest (mobile);

create unique index if not exists eoi_reference_number_key
  on public.expression_of_interest (reference_number);

-- -----------------------------------------------------------------------------
-- Triggers (Postgres 15+ / Supabase: EXECUTE FUNCTION)
-- -----------------------------------------------------------------------------
drop trigger if exists vendor_registration_set_updated_at on public.vendor_registration;
create trigger vendor_registration_set_updated_at
  before update on public.vendor_registration
  for each row execute function public.set_vendor_registration_updated_at();

drop trigger if exists expression_of_interest_set_updated_at on public.expression_of_interest;
create trigger expression_of_interest_set_updated_at
  before update on public.expression_of_interest
  for each row execute function public.set_expression_of_interest_updated_at();

-- -----------------------------------------------------------------------------
-- RLS + grants (anon can INSERT only; reads use service role on server)
-- -----------------------------------------------------------------------------
alter table public.vendor_registration enable row level security;
alter table public.expression_of_interest enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'vendor_registration'
      and policyname = 'Allow anonymous insert for vendor registration'
  ) then
    create policy "Allow anonymous insert for vendor registration"
      on public.vendor_registration
      for insert
      to anon, authenticated
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'expression_of_interest'
      and policyname = 'Allow anonymous insert for EOI'
  ) then
    create policy "Allow anonymous insert for EOI"
      on public.expression_of_interest
      for insert
      to anon, authenticated
      with check (true);
  end if;
end $$;

grant usage on schema public to anon, authenticated;
grant insert on public.vendor_registration to anon, authenticated;
grant insert on public.expression_of_interest to anon, authenticated;

-- =============================================================================
-- VERIFICATION — read results after running (expect all ok = true)
-- =============================================================================

with expected as (
  select *
  from (
    values
      ('vendor_registration', 'eoi_id'),
      ('vendor_registration', 'its_number'),
      ('vendor_registration', 'additional_service_locations'),
      ('vendor_registration', 'category_selections'),
      ('expression_of_interest', 'its_number'),
      ('expression_of_interest', 'business_city'),
      ('expression_of_interest', 'business_state'),
      ('expression_of_interest', 'can_work_in_programme_location'),
      ('expression_of_interest', 'main_category'),
      ('expression_of_interest', 'category_selections'),
      ('expression_of_interest', 'also_supplies_other_locations'),
      ('expression_of_interest', 'other_supply_locations_detail')
  ) as t(table_name, column_name)
)
select
  e.table_name,
  e.column_name,
  (c.column_name is not null) as column_exists,
  case
    when c.column_name is null then 'MISSING — re-run this script'
    else 'ok'
  end as status
from expected e
left join information_schema.columns c
  on c.table_schema = 'public'
  and c.table_name = e.table_name
  and c.column_name = e.column_name
order by e.table_name, e.column_name;

-- Quick row counts (should match what you see in Table Editor)
select 'vendor_registration' as table_name, count(*)::bigint as row_count
from public.vendor_registration
union all
select 'expression_of_interest', count(*)::bigint
from public.expression_of_interest;

-- Sample EOI references (confirm format EOI-YYYY-XXXXXX)
select reference_number, eoi_status, created_at
from public.expression_of_interest
order by created_at desc
limit 5;
