-- Structured city / state for EOI business address (used with PAN for GSTIN suggestion)

alter table public.expression_of_interest
  add column if not exists business_city text;

alter table public.expression_of_interest
  add column if not exists business_state text;

comment on column public.expression_of_interest.business_city is 'Registered / operating city.';
comment on column public.expression_of_interest.business_state is 'Indian state or UT name (matches GST state code lookup).';
