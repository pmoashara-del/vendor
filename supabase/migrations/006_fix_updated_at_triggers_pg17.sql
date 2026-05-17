-- Postgres 17: CREATE TRIGGER ... EXECUTE PROCEDURE is invalid; use EXECUTE FUNCTION.
-- Safe to re-run (drops and recreates triggers).

drop trigger if exists expression_of_interest_set_updated_at on public.expression_of_interest;
create trigger expression_of_interest_set_updated_at
  before update on public.expression_of_interest
  for each row execute function public.set_expression_of_interest_updated_at();

drop trigger if exists vendor_registration_set_updated_at on public.vendor_registration;
create trigger vendor_registration_set_updated_at
  before update on public.vendor_registration
  for each row execute function public.set_vendor_registration_updated_at();
