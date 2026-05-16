-- Expression of Interest (EOI) — first step before full vendor registration
-- Run after 001_vendor_registration.sql

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

  vendor_registration_id uuid references public.vendor_registration(id)
);

create index if not exists eoi_created_at_idx on public.expression_of_interest (created_at desc);
create index if not exists eoi_status_idx on public.expression_of_interest (eoi_status);
create index if not exists eoi_email_idx on public.expression_of_interest (lower(email));
create index if not exists eoi_category_idx on public.expression_of_interest (primary_category);

comment on table public.expression_of_interest is 'Vendor Expression of Interest — step 1 before full registration.';

create or replace function public.set_expression_of_interest_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists expression_of_interest_set_updated_at on public.expression_of_interest;
create trigger expression_of_interest_set_updated_at
  before update on public.expression_of_interest
  for each row execute function public.set_expression_of_interest_updated_at();

alter table public.expression_of_interest enable row level security;

create policy "Allow anonymous insert for EOI"
  on public.expression_of_interest
  for insert
  to anon, authenticated
  with check (true);

grant insert on public.expression_of_interest to anon, authenticated;

alter table public.vendor_registration
  add column if not exists eoi_id uuid references public.expression_of_interest(id);

create index if not exists vendor_registration_eoi_id_idx
  on public.vendor_registration (eoi_id) where eoi_id is not null;
