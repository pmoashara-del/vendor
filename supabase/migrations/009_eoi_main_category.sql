-- Broad industry (main category) for EOI; vendor type remains in primary_category.

alter table public.expression_of_interest
  add column if not exists main_category text;

comment on column public.expression_of_interest.main_category is
  'Broad industry / main category; primary_category holds vendor type (sub category).';
