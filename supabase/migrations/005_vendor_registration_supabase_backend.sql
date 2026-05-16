-- Vendor registration — Supabase backend alignment (run after 001–004)
-- Ensures optional linkage columns exist, adds helpful indexes and column comments,
-- and constrains aadhaar_linked_with_pan to values the application actually sends.

-- ---------------------------------------------------------------------------
-- Columns that may be missing if older migrations were skipped
-- ---------------------------------------------------------------------------

alter table public.vendor_registration
  add column if not exists eoi_id uuid references public.expression_of_interest (id);

alter table public.vendor_registration
  add column if not exists its_number text;

alter table public.vendor_registration
  drop constraint if exists vendor_registration_its_number_check;

alter table public.vendor_registration
  add constraint vendor_registration_its_number_check
  check (its_number is null or its_number ~ '^\d{8}$');

create index if not exists vendor_registration_eoi_id_idx
  on public.vendor_registration (eoi_id)
  where eoi_id is not null;

create index if not exists vendor_registration_its_number_idx
  on public.vendor_registration (its_number)
  where its_number is not null;

-- ---------------------------------------------------------------------------
-- Query support (admin lists, search)
-- ---------------------------------------------------------------------------

create index if not exists vendor_registration_status_created_idx
  on public.vendor_registration (registration_status, created_at desc);

create index if not exists vendor_registration_lower_email_idx
  on public.vendor_registration (lower(email));

-- ---------------------------------------------------------------------------
-- Data integrity (matches Zod / API payloads)
-- ---------------------------------------------------------------------------

alter table public.vendor_registration
  drop constraint if exists vendor_registration_aadhaar_linked_check;

alter table public.vendor_registration
  add constraint vendor_registration_aadhaar_linked_check
  check (aadhaar_linked_with_pan in ('yes', 'no', 'unknown'));

-- ---------------------------------------------------------------------------
-- Column documentation (maps 1:1 to VendorRegistrationForm + API)
-- ---------------------------------------------------------------------------

comment on table public.vendor_registration is
  'Full vendor onboarding record after EOI invitation; populated by POST /api/vendors/register.';

comment on column public.vendor_registration.id is 'Primary key; returned to client after insert.';
comment on column public.vendor_registration.created_at is 'Row creation time (UTC).';
comment on column public.vendor_registration.updated_at is 'Last update time; maintained by trigger.';
comment on column public.vendor_registration.registration_status is 'Workflow: pending | under_review | approved | rejected | on_hold.';
comment on column public.vendor_registration.eoi_id is 'Source Expression of Interest row when registered via invitation token.';
comment on column public.vendor_registration.its_number is 'Optional 8-digit ITS for community members; null otherwise.';

comment on column public.vendor_registration.company_name is 'Section 1: Vendor / company name.';
comment on column public.vendor_registration.vendor_type is 'Section 1: Vendor type.';
comment on column public.vendor_registration.constitution_of_business is 'Section 1: Constitution (e.g. proprietorship, private limited).';
comment on column public.vendor_registration.year_of_establishment is 'Section 1: Year established (nullable).';
comment on column public.vendor_registration.registered_address is 'Section 1: Registered address.';
comment on column public.vendor_registration.city is 'Section 1: City.';
comment on column public.vendor_registration.state is 'Section 1: State.';
comment on column public.vendor_registration.country is 'Section 1: Country (default India).';
comment on column public.vendor_registration.pin_code is 'Section 1: PIN code (6 digits).';

comment on column public.vendor_registration.primary_contact_person is 'Section 2: Primary contact name.';
comment on column public.vendor_registration.contact_designation is 'Section 2: Designation / role (nullable).';
comment on column public.vendor_registration.mobile_number is 'Section 2: Mobile (+91…).';
comment on column public.vendor_registration.alternate_mobile is 'Section 2: Alternate mobile (nullable).';
comment on column public.vendor_registration.email is 'Section 2: Email (normalized lowercase in API).';
comment on column public.vendor_registration.website is 'Section 2: Website URL (nullable).';

comment on column public.vendor_registration.pan_number is 'Section 3: PAN (10 characters).';
comment on column public.vendor_registration.gst_registered is 'Section 3: Whether GST registered.';
comment on column public.vendor_registration.gstin is 'Section 3: 15-char GSTIN when registered; null otherwise.';
comment on column public.vendor_registration.msme_registered is 'Section 3: MSME registered flag.';
comment on column public.vendor_registration.msme_udyam_number is 'Section 3: Udyam number when MSME registered.';
comment on column public.vendor_registration.tan_number is 'Section 3: TAN if applicable (nullable).';
comment on column public.vendor_registration.tds_applicability is 'Section 3: TDS notes (nullable).';
comment on column public.vendor_registration.aadhaar_linked_with_pan is 'Section 3: yes | no | unknown.';

comment on column public.vendor_registration.bank_name is 'Section 4: Bank name.';
comment on column public.vendor_registration.branch_name is 'Section 4: Branch name.';
comment on column public.vendor_registration.account_holder_name is 'Section 4: Account holder.';
comment on column public.vendor_registration.account_number is 'Section 4: Account number (digits).';
comment on column public.vendor_registration.ifsc_code is 'Section 4: IFSC.';
comment on column public.vendor_registration.account_type is 'Section 4: Account type.';

comment on column public.vendor_registration.main_category is 'Section 5: Main category of supply.';
comment on column public.vendor_registration.sub_category is 'Section 5: Sub-category (nullable).';
comment on column public.vendor_registration.products_services_offered is 'Section 5: Products / services description.';
comment on column public.vendor_registration.service_location_other is 'Section 5: Serves locations outside listed flags.';
comment on column public.vendor_registration.service_location_pan_india is 'Section 5: PAN India service.';
comment on column public.vendor_registration.service_location_madhya_pradesh is 'Section 5: Madhya Pradesh.';
comment on column public.vendor_registration.service_location_indore is 'Section 5: Indore.';
comment on column public.vendor_registration.turnover_fy_2023_24 is 'Section 5: Turnover FY 2023–24 (numeric, nullable).';
comment on column public.vendor_registration.turnover_fy_2024_25 is 'Section 5: Turnover FY 2024–25 (numeric, nullable).';
comment on column public.vendor_registration.turnover_fy_2025_26 is 'Section 5: Turnover FY 2025–26 (numeric, nullable).';
comment on column public.vendor_registration.expected_credit_period is 'Section 5: Expected credit period (nullable).';

comment on column public.vendor_registration.reference_1_name is 'Section 6: Reference 1 name (nullable).';
comment on column public.vendor_registration.reference_1_contact is 'Section 6: Reference 1 contact (nullable).';
comment on column public.vendor_registration.reference_2_name is 'Section 6: Reference 2 name (nullable).';
comment on column public.vendor_registration.reference_2_contact is 'Section 6: Reference 2 contact (nullable).';

comment on column public.vendor_registration.doc_pan_card is 'Section 7: Ack — will provide PAN card.';
comment on column public.vendor_registration.doc_cancelled_cheque is 'Section 7: Ack — cancelled cheque.';
comment on column public.vendor_registration.doc_address_proof is 'Section 7: Ack — address proof.';
comment on column public.vendor_registration.doc_company_registration is 'Section 7: Ack — company / firm registration.';
comment on column public.vendor_registration.doc_gst_certificate is 'Section 7: Ack — GST certificate when applicable.';
comment on column public.vendor_registration.doc_msme_certificate is 'Section 7: Ack — MSME certificate when applicable.';
comment on column public.vendor_registration.doc_other is 'Section 7: Ack — other documents.';
comment on column public.vendor_registration.doc_other_description is 'Section 7: Description when doc_other is true.';

comment on column public.vendor_registration.policy_accepted is 'Section 8: Policies accepted.';
comment on column public.vendor_registration.declaration_authorized_person_name is 'Section 9: Signatory name.';
comment on column public.vendor_registration.declaration_designation is 'Section 9: Signatory designation.';
comment on column public.vendor_registration.declaration_date is 'Section 9: Declaration date.';
comment on column public.vendor_registration.declaration_place is 'Section 9: Declaration place.';
