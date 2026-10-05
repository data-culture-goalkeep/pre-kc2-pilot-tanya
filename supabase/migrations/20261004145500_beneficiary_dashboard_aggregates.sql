-- Filtered aggregates stay in Postgres. SECURITY INVOKER preserves table RLS.
create or replace function public.beneficiary_dashboard_data(
  p_program public.program_enum default null,
  p_status public.status_enum default null,
  p_gender text default null,
  p_hospital public.hospital_enum default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
with filtered as (
  select program, status, nullif(btrim(gender), '') as gender, date_of_birth,
         nullif(btrim(primary_diagnosis), '') as primary_diagnosis, hospital
  from public.beneficiaries
  where (p_program is null or program = p_program)
    and (p_status is null or status = p_status)
    and (p_gender is null or lower(btrim(gender)) = lower(btrim(p_gender)))
    and (p_hospital is null or hospital = p_hospital)
),
ages as (
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
),
diagnosis_counts as (
  select primary_diagnosis as label, count(*)::bigint as value
  from filtered where primary_diagnosis is not null
  group by primary_diagnosis
),
top_diagnoses as (
  select label, value, row_number() over (order by value desc, label asc) as position
  from diagnosis_counts
),
chart_rows as (
  select 'program'::text as chart_name, coalesce(program::text, 'Unknown') as label, count(*)::bigint as value, 0::integer as sort_order from filtered group by program
  union all
  select 'status', coalesce(status::text, 'Unknown'), count(*)::bigint, 0::integer from filtered group by status
  union all
  select 'gender', coalesce(gender, 'Unknown'), count(*)::bigint, 0::integer from filtered group by gender
  union all
  select 'age_group', label, count(*)::bigint, min(sort_order)::integer from ages group by label
  union all
  select 'primary_diagnosis', label, value, 0::integer from top_diagnoses where position <= 10
  union all
  select 'hospital', coalesce(hospital::text, 'Unknown'), count(*)::bigint, 0::integer from filtered group by hospital
)
select jsonb_build_object(
  'summary', (select jsonb_build_object(
    'total_count', count(*)::bigint,
    'active_count', count(*) filter (where status = 'Active')::bigint,
    'exited_count', count(*) filter (where status is distinct from 'Active')::bigint
  ) from filtered),
  'charts', coalesce((select jsonb_agg(jsonb_build_object('chart_name', chart_name, 'label', label, 'value', value, 'sort_order', sort_order) order by chart_name, sort_order, label) from chart_rows), '[]'::jsonb)
);
$$;

revoke all on function public.beneficiary_dashboard_data(public.program_enum, public.status_enum, text, public.hospital_enum) from public;
grant execute on function public.beneficiary_dashboard_data(public.program_enum, public.status_enum, text, public.hospital_enum) to anon, authenticated;
