-- TEST ONLY - tighten before real data
-- Adds date-derived April-to-March financial-year filters to Beneficiaries and Assessments.
-- No financial-year columns are stored and no source rows are modified.

begin;

drop function if exists public.beneficiary_dashboard_data(
  public.program_enum, public.status_enum, text, public.hospital_enum
);

create function public.beneficiary_dashboard_data(
  p_program public.program_enum default null,
  p_status public.status_enum default null,
  p_gender text default null,
  p_hospital public.hospital_enum default null,
  p_financial_year text default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
with available_years as (
  select distinct fy.start_year,
    fy.start_year::text || '-' || lpad(((fy.start_year + 1) % 100)::text, 2, '0') as financial_year
  from public.beneficiaries b
  cross join lateral (
    select extract(year from b.registration_date)::integer
      - case when extract(month from b.registration_date)::integer >= 4 then 0 else 1 end as start_year
  ) fy
  where b.registration_date is not null
), filtered as (
  select beneficiary_id, registration_date, program, status,
         nullif(btrim(gender), '') as gender, date_of_birth,
         nullif(btrim(primary_diagnosis), '') as primary_diagnosis, hospital
  from public.beneficiaries
  where (p_program is null or program = p_program)
    and (p_status is null or status = p_status)
    and (p_gender is null or lower(btrim(gender)) = lower(btrim(p_gender)))
    and (p_hospital is null or hospital = p_hospital)
    and (p_financial_year is null or (
      p_financial_year ~ '^[0-9]{4}-[0-9]{2}$'
      and p_financial_year = split_part(p_financial_year, '-', 1) || '-' || lpad(((split_part(p_financial_year, '-', 1)::integer + 1) % 100)::text, 2, '0')
      and registration_date >= make_date(split_part(p_financial_year, '-', 1)::integer, 4, 1)
      and registration_date < make_date(split_part(p_financial_year, '-', 1)::integer + 1, 4, 1)
    ))
), ages as (
  select case
      when date_of_birth is null then 'Unknown'
      when extract(year from age(current_date, date_of_birth))::integer < 1 then 'Under 1'
      when extract(year from age(current_date, date_of_birth))::integer <= 5 then '1–5'
      when extract(year from age(current_date, date_of_birth))::integer <= 12 then '6–12'
      when extract(year from age(current_date, date_of_birth))::integer <= 18 then '13–18'
      else '19+'
    end as label,
    case
      when date_of_birth is null then 99
      when extract(year from age(current_date, date_of_birth))::integer < 1 then 1
      when extract(year from age(current_date, date_of_birth))::integer <= 5 then 2
      when extract(year from age(current_date, date_of_birth))::integer <= 12 then 3
      when extract(year from age(current_date, date_of_birth))::integer <= 18 then 4
      else 5
    end as sort_order
  from filtered
), diagnosis_counts as (
  select primary_diagnosis as label, count(*)::bigint as value
  from filtered where primary_diagnosis is not null
  group by primary_diagnosis
), top_diagnoses as (
  select label, value, row_number() over (order by value desc, label asc) as position
  from diagnosis_counts
), chart_rows as (
  select 'program'::text as chart_name, coalesce(program::text, 'Unknown') as label, count(*)::bigint as value, 0::integer as sort_order from filtered group by program
  union all select 'status', coalesce(status::text, 'Unknown'), count(*)::bigint, 0::integer from filtered group by status
  union all select 'gender', coalesce(gender, 'Unknown'), count(*)::bigint, 0::integer from filtered group by gender
  union all select 'age_group', label, count(*)::bigint, min(sort_order)::integer from ages group by label
  union all select 'primary_diagnosis', label, value, 0::integer from top_diagnoses where position <= 10
  union all select 'hospital', coalesce(hospital::text, 'Unknown'), count(*)::bigint, 0::integer from filtered group by hospital
)
select jsonb_build_object(
  'summary', (select jsonb_build_object(
    'total_count', count(*)::bigint,
    'active_count', count(*) filter (where status = 'Active')::bigint,
    'exited_count', count(*) filter (where status is distinct from 'Active')::bigint
  ) from filtered),
  'charts', coalesce((select jsonb_agg(jsonb_build_object('chart_name', chart_name, 'label', label, 'value', value, 'sort_order', sort_order) order by chart_name, sort_order, label) from chart_rows), '[]'::jsonb),
  'financial_years', coalesce((select jsonb_agg(financial_year order by start_year desc) from available_years), '[]'::jsonb)
);
$$;

revoke all on function public.beneficiary_dashboard_data(
  public.program_enum, public.status_enum, text, public.hospital_enum, text
) from public;
grant execute on function public.beneficiary_dashboard_data(
  public.program_enum, public.status_enum, text, public.hospital_enum, text
) to anon, authenticated;

drop function if exists public.assessments_dashboard_data(text, text, public.month_enum);

create function public.assessments_dashboard_data(
  p_test text default null,
  p_phase text default null,
  p_month public.month_enum default null,
  p_financial_year text default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
with all_dates as (
  select assessment_date from public.rosenberg_assessment_history
  union all
  select assessment_date from public.stirling_assessment_history
), available_years as (
  select distinct fy.start_year,
    fy.start_year::text || '-' || lpad(((fy.start_year + 1) % 100)::text, 2, '0') as financial_year
  from all_dates d
  cross join lateral (
    select extract(year from d.assessment_date)::integer
      - case when extract(month from d.assessment_date)::integer >= 4 then 0 else 1 end as start_year
  ) fy
  where d.assessment_date is not null
), r as (
  select * from public.rosenberg_assessment_history
  where (p_test is null or p_test = 'Rosenberg')
    and p_phase is null
    and (p_month is null or to_char(assessment_date, 'FMMonth') = p_month::text)
    and (p_financial_year is null or (
      p_financial_year ~ '^[0-9]{4}-[0-9]{2}$'
      and p_financial_year = split_part(p_financial_year, '-', 1) || '-' || lpad(((split_part(p_financial_year, '-', 1)::integer + 1) % 100)::text, 2, '0')
      and assessment_date >= make_date(split_part(p_financial_year, '-', 1)::integer, 4, 1)
      and assessment_date < make_date(split_part(p_financial_year, '-', 1)::integer + 1, 4, 1)
    ))
), s as (
  select * from public.stirling_assessment_history
  where (p_test is null or p_test = 'Stirling')
    and (p_phase is null or test_type::text = p_phase)
    and (p_month is null or to_char(assessment_date, 'FMMonth') = p_month::text)
    and (p_financial_year is null or (
      p_financial_year ~ '^[0-9]{4}-[0-9]{2}$'
      and p_financial_year = split_part(p_financial_year, '-', 1) || '-' || lpad(((split_part(p_financial_year, '-', 1)::integer + 1) % 100)::text, 2, '0')
      and assessment_date >= make_date(split_part(p_financial_year, '-', 1)::integer, 4, 1)
      and assessment_date < make_date(split_part(p_financial_year, '-', 1)::integer + 1, 4, 1)
    ))
), rs as (
  select 'Rosenberg'::text as test, 'q' || q as question, raw as answer, count(*)::bigint as value
  from r cross join lateral (values (1,q1_raw),(2,q2_raw),(3,q3_raw),(4,q4_raw),(5,q5_raw),(6,q6_raw),(7,q7_raw),(8,q8_raw),(9,q9_raw),(10,q10_raw)) v(q,raw)
  where raw is not null group by q, raw
), ss as (
  select 'Stirling'::text as test, 'Score ' || score::text as question, test_type::text as answer, count(*)::bigint as value
  from s cross join lateral (values (1,q1),(2,q2),(3,q3),(4,q4),(5,q5),(6,q6),(7,q7),(8,q8),(9,q9),(10,q10),(11,q11),(12,q12),(13,q13),(14,q14),(15,q15)) v(q,score)
  where score is not null group by score, test_type
), charts as (
  select test as chart_name, question as label, value::numeric, question as series, answer as detail from rs
  union all select test, question, value::numeric, answer, answer from ss
), all_assessments as (
  select beneficiary_id, assessment_date from r union all select beneficiary_id, assessment_date from s
), paired as (
  select beneficiary_id from s group by beneficiary_id having bool_or(test_type = 'Pre') and bool_or(test_type = 'Post')
)
select jsonb_build_object(
  'summary', jsonb_build_object(
    'assessments_recorded', (select count(*) from r) + (select count(*) from s),
    'children_assessed', (select count(distinct beneficiary_id) from all_assessments),
    'pre_post_pairs', (select count(*) from paired)
  ),
  'charts', coalesce((select jsonb_agg(jsonb_build_object('chart_name',chart_name,'label',label,'value',value,'series',series,'detail',detail) order by chart_name,label,series,detail) from charts), '[]'::jsonb),
  'financial_years', coalesce((select jsonb_agg(financial_year order by start_year desc) from available_years), '[]'::jsonb)
);
$$;

revoke all on function public.assessments_dashboard_data(text, text, public.month_enum, text) from public;
grant execute on function public.assessments_dashboard_data(text, text, public.month_enum, text) to anon, authenticated;

create or replace view public.assessments_records
with (security_invoker = true)
as
select 'Rosenberg'::text as test_type, null::text as phase,
  rosenberg_assessment_id::text as record_id, beneficiary_id,
  coalesce(name_of_child, '') as name_of_child, assessment_date,
  to_char(assessment_date, 'FMMonth') as month, notes,
  case when assessment_date is null then null
    when extract(month from assessment_date)::integer >= 4 then
      extract(year from assessment_date)::integer::text || '-' || lpad(((extract(year from assessment_date)::integer + 1) % 100)::text, 2, '0')
    else (extract(year from assessment_date)::integer - 1)::text || '-' || lpad((extract(year from assessment_date)::integer % 100)::text, 2, '0')
  end as financial_year
from public.rosenberg_assessment_history
union all
select 'Stirling', test_type::text, stirling_assessment_id::text,
  beneficiary_id, coalesce(name_of_child, ''), assessment_date,
  to_char(assessment_date, 'FMMonth'), notes,
  case when assessment_date is null then null
    when extract(month from assessment_date)::integer >= 4 then
      extract(year from assessment_date)::integer::text || '-' || lpad(((extract(year from assessment_date)::integer + 1) % 100)::text, 2, '0')
    else (extract(year from assessment_date)::integer - 1)::text || '-' || lpad((extract(year from assessment_date)::integer % 100)::text, 2, '0')
  end
from public.stirling_assessment_history;

grant select on public.assessments_records to anon, authenticated;

commit;
