-- Aggregated-only views for the Beneficiaries dashboard.
-- These views respect the caller's table grants and RLS policies.
create or replace view public.beneficiary_dashboard_summary
with (security_invoker = true)
as
select
  count(*)::bigint as total_count,
  count(*) filter (where status = 'Active')::bigint as active_count,
  count(*) filter (where status is distinct from 'Active')::bigint as exited_count
from public.beneficiaries;

create or replace view public.beneficiary_dashboard_chart_data
with (security_invoker = true)
as
with base as (
  select
    program::text as program,
    status::text as status,
    nullif(btrim(gender), '') as gender,
    date_of_birth,
    nullif(btrim(primary_diagnosis), '') as primary_diagnosis,
    hospital::text as hospital
  from public.beneficiaries
),
age_groups as (
  select
    case
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
  from base
),
diagnosis_counts as (
  select primary_diagnosis as label, count(*)::bigint as value
  from base
  where primary_diagnosis is not null
  group by primary_diagnosis
),
top_diagnoses as (
  select label, value, row_number() over (order by value desc, label asc) as position
  from diagnosis_counts
)
select 'program'::text as chart_name, coalesce(program, 'Unknown') as label, count(*)::bigint as value, 0::integer as sort_order
from base group by program
union all
select 'status', coalesce(status, 'Unknown'), count(*)::bigint, 0::integer
from base group by status
union all
select 'gender', coalesce(gender, 'Unknown'), count(*)::bigint, 0::integer
from base group by gender
union all
select 'age_group', label, count(*)::bigint, min(sort_order)::integer
from age_groups group by label
union all
select 'primary_diagnosis', label, value, 0::integer
from top_diagnoses where position <= 10
union all
select 'hospital', coalesce(hospital, 'Unknown'), count(*)::bigint, 0::integer
from base group by hospital;

grant select on public.beneficiary_dashboard_summary, public.beneficiary_dashboard_chart_data to anon, authenticated;
