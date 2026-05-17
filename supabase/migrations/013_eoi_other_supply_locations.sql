-- EOI: capture whether vendor supplies elsewhere and free-text detail

alter table public.expression_of_interest
  add column if not exists also_supplies_other_locations text not null default 'No'
  check (also_supplies_other_locations in ('Yes', 'No'));

alter table public.expression_of_interest
  add column if not exists other_supply_locations_detail text;

comment on column public.expression_of_interest.also_supplies_other_locations is
  'Whether the applicant supplies in other locations (outside Indore/MP programme geography) for similar goods or services.';

comment on column public.expression_of_interest.other_supply_locations_detail is
  'States, cities, or regions when also_supplies_other_locations is Yes; otherwise null.';
