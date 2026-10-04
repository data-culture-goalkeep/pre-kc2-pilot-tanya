-- TEST ONLY - tighten before real data
-- Deliberately permits unauthenticated access to this dummy-data table only.
begin;

alter table public.beneficiaries enable row level security;
grant select, insert on table public.beneficiaries to anon, authenticated;

create policy beneficiaries_test_select
  on public.beneficiaries for select
  to anon, authenticated
  using (true);

create policy beneficiaries_test_insert
  on public.beneficiaries for insert
  to anon, authenticated
  with check (
    source_file = 'Happy Feet Dashboard'
    and source_sheet = 'Manual Entry'
    and source_row > 0
  );

commit;
