-- Optional community ITS number on Expression of Interest

alter table public.expression_of_interest
  add column if not exists its_number text;

alter table public.expression_of_interest
  drop constraint if exists expression_of_interest_its_number_check;

alter table public.expression_of_interest
  add constraint expression_of_interest_its_number_check
  check (its_number is null or its_number ~ '^\d{8}$');

comment on column public.expression_of_interest.its_number is
  'Optional 8-digit ITS identifier for community members.';
