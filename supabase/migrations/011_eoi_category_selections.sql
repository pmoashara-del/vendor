-- Multiple main categories and multiple sub (vendor type) selections per EOI.
-- `category_selections` is the source of truth: jsonb array of {"main","sub"} objects.
-- `main_category` / `primary_category` remain populated as human-readable summaries for search and legacy views.

alter table public.expression_of_interest
  add column if not exists category_selections jsonb not null default '[]'::jsonb;

comment on column public.expression_of_interest.category_selections is
  'Array of {main, sub} pairs; mains may repeat with different subs. Legacy main_category / primary_category hold summaries.';

update public.expression_of_interest
set category_selections = jsonb_build_array(
  jsonb_build_object('main', btrim(main_category), 'sub', btrim(primary_category))
)
where jsonb_array_length(category_selections) = 0
  and main_category is not null
  and btrim(main_category) <> ''
  and primary_category is not null
  and btrim(primary_category) <> '';
