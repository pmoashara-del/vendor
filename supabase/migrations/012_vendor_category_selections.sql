-- Multiple main categories and multiple sub selections for full vendor registration.

alter table public.vendor_registration
  add column if not exists category_selections jsonb not null default '[]'::jsonb;

comment on column public.vendor_registration.category_selections is
  'Array of {main, sub} pairs aligned with EOI taxonomy. main_category / sub_category hold summaries.';

update public.vendor_registration
set category_selections = jsonb_build_array(
  jsonb_build_object('main', btrim(main_category), 'sub', btrim(sub_category))
)
where jsonb_array_length(category_selections) = 0
  and sub_category is not null
  and btrim(sub_category) <> ''
  and main_category is not null
  and btrim(main_category) <> '';
