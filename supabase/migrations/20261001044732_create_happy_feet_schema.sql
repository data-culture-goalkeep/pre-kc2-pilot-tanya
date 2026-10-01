-- Happy Feet Home source schema
-- Model decisions: source-row reruns for pilot; sort/insert changes require a clean reload.
-- Hospital children are keyed by exact child_name and remain separate from beneficiaries.
-- Rosenberg uses the authorized straight conversion only; source totals are never recalculated.

create type public.program_enum as enum ('Daycare', 'Homecare');
create type public.status_enum as enum ('Active', 'Deceased');
create type public.month_enum as enum (
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
);
create type public.quarter_enum as enum ('Q1', 'Q2', 'Q3', 'Q4');
create type public.contact_type_enum as enum ('Call', 'Visit');
create type public.assessment_test_type_enum as enum ('Pre', 'Post');
create type public.attendance_code_enum as enum ('P', 'NA');
create type public.ward_enum as enum (
  'General Ward', 'Hematology Ward', 'Pediatric Ward', 'Ward A', 'Ward B'
);
create type public.hospital_enum as enum (
  'Metro Care Hospital A', 'Metro Care Hospital B',
  'Metro Care Hospital C', 'Metro Care Hospital D'
);

create table public.beneficiaries (
  beneficiary_id text primary key,
  registration_date date,
  name_of_child text,
  program public.program_enum,
  primary_diagnosis text,
  sub_diagnosis text,
  gender text,
  level_of_care text,
  location text,
  address text,
  date_of_birth date,
  age integer,
  primary_mobile_no text,
  secondary_mobile_no text,
  current_status_life_goals text,
  life_goals_discontinued_date date,
  family_occupation text,
  family_members text,
  interested_in_daycare_program text,
  hospital public.hospital_enum,
  ward_department public.ward_enum,
  status public.status_enum,
  exit_date date,
  job_description text,
  financially_independent text,
  salary_per_month numeric,
  notes text,
  source_used text,
  verification_from_goalkeep boolean,
  verification_from_hfh boolean,
  doubt_from_goalkeep text,
  hfh_comments text,
  source_file text not null,
  source_sheet text not null,
  source_row integer not null,
  constraint beneficiaries_source_row_uq unique (source_file, source_sheet, source_row)
);

create table public.daycare_attendance (
  attendance_id uuid primary key default gen_random_uuid(),
  beneficiary_id text not null references public.beneficiaries(beneficiary_id),
  financial_year text,
  month public.month_enum,
  day_01 public.attendance_code_enum,
  day_02 public.attendance_code_enum,
  day_03 public.attendance_code_enum,
  day_04 public.attendance_code_enum,
  day_05 public.attendance_code_enum,
  day_06 public.attendance_code_enum,
  day_07 public.attendance_code_enum,
  day_08 public.attendance_code_enum,
  day_09 public.attendance_code_enum,
  day_10 public.attendance_code_enum,
  day_11 public.attendance_code_enum,
  day_12 public.attendance_code_enum,
  day_13 public.attendance_code_enum,
  day_14 public.attendance_code_enum,
  day_15 public.attendance_code_enum,
  day_16 public.attendance_code_enum,
  day_17 public.attendance_code_enum,
  day_18 public.attendance_code_enum,
  day_19 public.attendance_code_enum,
  day_20 public.attendance_code_enum,
  day_21 public.attendance_code_enum,
  day_22 public.attendance_code_enum,
  day_23 public.attendance_code_enum,
  day_24 public.attendance_code_enum,
  day_25 public.attendance_code_enum,
  day_26 public.attendance_code_enum,
  day_27 public.attendance_code_enum,
  day_28 public.attendance_code_enum,
  day_29 public.attendance_code_enum,
  day_30 public.attendance_code_enum,
  day_31 public.attendance_code_enum,
  total_present integer,
  had_access_to_4_meals_a_day boolean,
  notes text,
  source_used text,
  verification_from_goalkeep boolean,
  verification_from_hfh boolean,
  doubt_from_goalkeep text,
  hfh_comments text,
  source_file text not null,
  source_sheet text not null,
  source_row integer not null,
  constraint daycare_attendance_source_row_uq unique (source_file, source_sheet, source_row)
);

create table public.daycare_quarterly (
  daycare_quarterly_id uuid primary key default gen_random_uuid(),
  beneficiary_id text not null references public.beneficiaries(beneficiary_id),
  name_of_child text,
  financial_year text,
  quarter public.quarter_enum,
  diagnosis text,
  grocery_support_required_date date,
  grocery_support_provided_date date,
  medicine_support_required_date date,
  medicine_support_provided_date date,
  one_to_one_therapy_required_date date,
  one_to_one_therapy_provided_date date,
  intensive_intervention_psychiatric_medicines_required_date date,
  intensive_intervention_psychiatric_medicines_provided_date date,
  educational_support_required_date date,
  educational_provided_required_date date,
  height_in_cm numeric,
  weight_in_kg numeric,
  cd4_for_hiv_children numeric,
  viral_load_for_hiv text,
  no_of_blood_transfusions_in_a_month integer,
  hospital_admissions_in_quarter text,
  current_status_education text,
  school_college_fees_tuition text,
  extracurricular_support text,
  home_schooling_tuition text,
  life_skill_empowerment_session_at_hfh text,
  english_speaking_session text,
  extracurricular_activities text,
  celebration_exposure text,
  life_status public.status_enum,
  exit_date date,
  basic_necessities text,
  notes text,
  source_used text,
  verification_from_goalkeep boolean,
  verification_from_hfh boolean,
  doubt_from_goalkeep text,
  hfh_comments text,
  source_file text not null,
  source_sheet text not null,
  source_row integer not null,
  constraint daycare_quarterly_source_row_uq unique (source_file, source_sheet, source_row)
);

create table public.homecare_monthly (
  homecare_monthly_id uuid primary key default gen_random_uuid(),
  beneficiary_id text not null references public.beneficiaries(beneficiary_id),
  name_of_child text,
  financial_year text,
  month public.month_enum,
  diagnosis_illness text,
  contact_number text,
  life_status public.status_enum,
  exit_date date,
  contact_type public.contact_type_enum,
  home_call_visit_date date,
  therapist_social_worker_nurse text,
  grocery_support_required_date date,
  grocery_support_provided_date date,
  medicine_support_required_date date,
  medicine_support_provided_date date,
  educational_support_required_date date,
  educational_support_provided_date date,
  any_other_support_required text,
  any_other_support_provided text,
  weight_in_kg numeric,
  height_in_cm numeric,
  notes text,
  source_used text,
  verification_from_goalkeep boolean,
  verification_from_hfh boolean,
  doubt_from_goalkeep text,
  hfh_comments text,
  source_file text not null,
  source_sheet text not null,
  source_row integer not null,
  constraint homecare_monthly_source_row_uq unique (source_file, source_sheet, source_row)
);

create sequence public.hospital_child_id_seq start with 1;

create function public.next_hospital_child_id()
returns text
language sql
volatile
as $$
  select 'H-' || case when n < 10000 then lpad(n::text, 4, '0') else n::text end
  from (select nextval('public.hospital_child_id_seq'::regclass) as n) generated;
$$;

revoke all on sequence public.hospital_child_id_seq from public, anon, authenticated;
grant usage, select on sequence public.hospital_child_id_seq to service_role;
revoke all on function public.next_hospital_child_id() from public, anon, authenticated;
grant execute on function public.next_hospital_child_id() to service_role;

create table public.hospital_children (
  hospital_child_id text primary key default public.next_hospital_child_id(),
  child_name text not null unique,
  source_file text not null,
  source_sheet text not null,
  source_row integer not null,
  constraint hospital_children_source_row_uq unique (source_file, source_sheet, source_row)
);

create table public.hospital_session_feedback (
  hospital_session_feedback_id uuid primary key default gen_random_uuid(),
  hospital_child_id text not null references public.hospital_children(hospital_child_id),
  facilitator text,
  session_date date,
  diagnosis text,
  hospital_name public.hospital_enum,
  ward public.ward_enum,
  ritual text,
  warm_up text,
  core_activity text,
  closure text,
  feeling_on_entry text,
  feeling_during_activity text,
  felt_relaxed text,
  activity_fun text,
  would_attend_again text,
  notes text,
  source_used text,
  source_file text not null,
  source_sheet text not null,
  source_row integer not null,
  constraint hospital_session_feedback_source_row_uq unique (source_file, source_sheet, source_row)
);

create table public.rosenberg_assessment_history (
  rosenberg_assessment_id uuid primary key default gen_random_uuid(),
  beneficiary_id text not null references public.beneficiaries(beneficiary_id),
  name_of_child text,
  assessment_date date,
  q1_raw text check (q1_raw in ('SA', 'A', 'DA', 'SD')),
  q1_value smallint check (q1_value between 1 and 4),
  q2_raw text check (q2_raw in ('SA', 'A', 'DA', 'SD')),
  q2_value smallint check (q2_value between 1 and 4),
  q3_raw text check (q3_raw in ('SA', 'A', 'DA', 'SD')),
  q3_value smallint check (q3_value between 1 and 4),
  q4_raw text check (q4_raw in ('SA', 'A', 'DA', 'SD')),
  q4_value smallint check (q4_value between 1 and 4),
  q5_raw text check (q5_raw in ('SA', 'A', 'DA', 'SD')),
  q5_value smallint check (q5_value between 1 and 4),
  q6_raw text check (q6_raw in ('SA', 'A', 'DA', 'SD')),
  q6_value smallint check (q6_value between 1 and 4),
  q7_raw text check (q7_raw in ('SA', 'A', 'DA', 'SD')),
  q7_value smallint check (q7_value between 1 and 4),
  q8_raw text check (q8_raw in ('SA', 'A', 'DA', 'SD')),
  q8_value smallint check (q8_value between 1 and 4),
  q9_raw text check (q9_raw in ('SA', 'A', 'DA', 'SD')),
  q9_value smallint check (q9_value between 1 and 4),
  q10_raw text check (q10_raw in ('SA', 'A', 'DA', 'SD')),
  q10_value smallint check (q10_value between 1 and 4),
  source_total_score integer,
  notes text,
  verification_from_goalkeep boolean,
  verification_from_hfh boolean,
  doubt_from_goalkeep text,
  hfh_comments text,
  source_file text not null,
  source_sheet text not null,
  source_row integer not null,
  constraint rosenberg_assessment_history_source_row_uq unique (source_file, source_sheet, source_row)
);

create table public.stirling_assessment_history (
  stirling_assessment_id uuid primary key default gen_random_uuid(),
  beneficiary_id text not null references public.beneficiaries(beneficiary_id),
  name_of_child text,
  test_type public.assessment_test_type_enum,
  assessment_date date,
  q1 smallint check (q1 between 1 and 5),
  q2 smallint check (q2 between 1 and 5),
  q3 smallint check (q3 between 1 and 5),
  q4 smallint check (q4 between 1 and 5),
  q5 smallint check (q5 between 1 and 5),
  q6 smallint check (q6 between 1 and 5),
  q7 smallint check (q7 between 1 and 5),
  q8 smallint check (q8 between 1 and 5),
  q9 smallint check (q9 between 1 and 5),
  q10 smallint check (q10 between 1 and 5),
  q11 smallint check (q11 between 1 and 5),
  q12 smallint check (q12 between 1 and 5),
  q13 smallint check (q13 between 1 and 5),
  q14 smallint check (q14 between 1 and 5),
  q15 smallint check (q15 between 1 and 5),
  source_total_score integer,
  notes text,
  verification_from_goalkeep boolean,
  verification_from_hfh boolean,
  doubt_from_goalkeep text,
  hfh_comments text,
  source text,
  source_file text not null,
  source_sheet text not null,
  source_row integer not null,
  constraint stirling_assessment_history_source_row_uq unique (source_file, source_sheet, source_row)
);

create index daycare_attendance_beneficiary_id_idx on public.daycare_attendance(beneficiary_id);
create index daycare_quarterly_beneficiary_id_idx on public.daycare_quarterly(beneficiary_id);
create index homecare_monthly_beneficiary_id_idx on public.homecare_monthly(beneficiary_id);
create index hospital_session_feedback_hospital_child_id_idx on public.hospital_session_feedback(hospital_child_id);
create index rosenberg_assessment_history_beneficiary_id_idx on public.rosenberg_assessment_history(beneficiary_id);
create index stirling_assessment_history_beneficiary_id_idx on public.stirling_assessment_history(beneficiary_id);

comment on column public.beneficiaries.current_status_life_goals is
  'Source header says Current Status : Life Goals; observed values include education statuses. Preserve raw text pending review.';
comment on column public.daycare_quarterly.educational_provided_required_date is
  'Source header says Educational Provided Required Date; retain literal meaning pending clarification.';
comment on table public.hospital_children is
  'Separate from beneficiaries. Children are identified by exact name only; live projects should capture a child ID.';
comment on table public.rosenberg_assessment_history is
  'Straight mapping only: SD=1, DA=2, A=3, SA=4. Source total is preserved; scoring key not confirmed, PM to validate with the NGO.';

alter table public.beneficiaries enable row level security;
alter table public.daycare_attendance enable row level security;
alter table public.daycare_quarterly enable row level security;
alter table public.homecare_monthly enable row level security;
alter table public.hospital_children enable row level security;
alter table public.hospital_session_feedback enable row level security;
alter table public.rosenberg_assessment_history enable row level security;
alter table public.stirling_assessment_history enable row level security;

revoke all on table public.beneficiaries from public, anon, authenticated;
revoke all on table public.daycare_attendance from public, anon, authenticated;
revoke all on table public.daycare_quarterly from public, anon, authenticated;
revoke all on table public.homecare_monthly from public, anon, authenticated;
revoke all on table public.hospital_children from public, anon, authenticated;
revoke all on table public.hospital_session_feedback from public, anon, authenticated;
revoke all on table public.rosenberg_assessment_history from public, anon, authenticated;
revoke all on table public.stirling_assessment_history from public, anon, authenticated;
