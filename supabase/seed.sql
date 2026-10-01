-- Synthetic smoke-test fixture only. Do not use this file for production or real beneficiary data.
-- Run after migrations in an isolated development database. Source metadata deliberately marks
-- every row as seed data. ON CONFLICT clauses make repeated runs idempotent.

insert into public.beneficiaries (
  beneficiary_id, registration_date, name_of_child, program, primary_diagnosis,
  source_file, source_sheet, source_row
) values (
  'SEED-BEN-0001', date '2026-01-05', 'Synthetic Child One',
  'Daycare', 'Synthetic diagnosis',
  'seed.sql', 'synthetic_fixture', 1
)
on conflict (beneficiary_id) do nothing;

insert into public.daycare_attendance (
  beneficiary_id, financial_year, month, day_01, day_02, total_present,
  source_file, source_sheet, source_row
) values (
  'SEED-BEN-0001', '2026-2027', 'January', 'P', 'NA', 1,
  'seed.sql', 'synthetic_fixture', 2
)
on conflict (source_file, source_sheet, source_row) do nothing;

insert into public.daycare_quarterly (
  beneficiary_id, financial_year, quarter, diagnosis, height_in_cm, weight_in_kg,
  source_file, source_sheet, source_row
) values (
  'SEED-BEN-0001', '2026-2027', 'Q1', 'Synthetic diagnosis', 100, 15,
  'seed.sql', 'synthetic_fixture', 3
)
on conflict (source_file, source_sheet, source_row) do nothing;

insert into public.homecare_monthly (
  beneficiary_id, financial_year, month, diagnosis_illness, contact_type,
  source_file, source_sheet, source_row
) values (
  'SEED-BEN-0001', '2026-2027', 'January', 'Synthetic diagnosis', 'Call',
  'seed.sql', 'synthetic_fixture', 4
)
on conflict (source_file, source_sheet, source_row) do nothing;

with child as (
  insert into public.hospital_children (
    child_name, source_file, source_sheet, source_row
  ) values (
    'Synthetic Hospital Child', 'seed.sql', 'synthetic_fixture', 5
  )
  on conflict (child_name) do update set child_name = excluded.child_name
  returning hospital_child_id
)
insert into public.hospital_session_feedback (
  hospital_child_id, session_date, hospital_name, ward, source_file, source_sheet, source_row
)
select hospital_child_id, date '2026-01-06', 'Metro Care Hospital A', 'General Ward',
       'seed.sql', 'synthetic_fixture', 6
from child
on conflict (source_file, source_sheet, source_row) do nothing;

insert into public.rosenberg_assessment_history (
  beneficiary_id, assessment_date, q1_raw, q1_value, source_total_score,
  source_file, source_sheet, source_row
) values (
  'SEED-BEN-0001', date '2026-01-07', 'SA', 4, 28,
  'seed.sql', 'synthetic_fixture', 7
)
on conflict (source_file, source_sheet, source_row) do nothing;

insert into public.stirling_assessment_history (
  beneficiary_id, test_type, assessment_date, q1, source_total_score,
  source_file, source_sheet, source_row
) values (
  'SEED-BEN-0001', 'Pre', date '2026-01-08', 3, 3,
  'seed.sql', 'synthetic_fixture', 8
)
on conflict (source_file, source_sheet, source_row) do nothing;
