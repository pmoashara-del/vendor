-- Whether the applicant can take on work in Indore / Madhya Pradesh for this programme.

alter table public.expression_of_interest
  add column if not exists can_work_in_programme_location text;

comment on column public.expression_of_interest.can_work_in_programme_location is
  'Yes / No / Limited — can the vendor take on work based in Indore / Madhya Pradesh for this programme.';
