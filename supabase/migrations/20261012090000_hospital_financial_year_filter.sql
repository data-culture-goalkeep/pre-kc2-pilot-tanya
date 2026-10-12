-- TEST ONLY - tighten before real data
-- Add April-to-March financial year filtering to Hospital Sessions analytics and records.

drop function if exists public.hospital_sessions_dashboard_data(public.month_enum, public.hospital_enum);

create or replace function public.hospital_sessions_dashboard_data(
  p_month public.month_enum default null,
  p_hospital public.hospital_enum default null,
  p_financial_year text default null
)
returns jsonb
language sql stable security invoker set search_path = public
as $$
with available_years as (
  select distinct fy.start_year,
    fy.start_year::text || '-' || lpad(((fy.start_year + 1) % 100)::text, 2, '0') as financial_year
  from public.hospital_session_feedback f
  cross join lateral (
    select extract(year from f.session_date)::integer
      - case when extract(month from f.session_date)::integer >= 4 then 0 else 1 end as start_year
  ) fy
  where f.session_date is not null
    and (p_hospital is null or f.hospital_name = p_hospital)
), filtered as (
  select f.hospital_session_feedback_id, f.hospital_child_id, c.child_name,
    f.session_date, f.hospital_name,
    extract(month from f.session_date)::integer as calendar_month,
    to_char(f.session_date, 'FMMonth') as month_label,
    fy.start_year::text || '-' || lpad(((fy.start_year + 1) % 100)::text, 2, '0') as financial_year
  from public.hospital_session_feedback f
  join public.hospital_children c using (hospital_child_id)
  cross join lateral (
    select extract(year from f.session_date)::integer
      - case when extract(month from f.session_date)::integer >= 4 then 0 else 1 end as start_year
  ) fy
  where (p_month is null or to_char(f.session_date, 'FMMonth') = p_month::text)
    and (p_hospital is null or f.hospital_name = p_hospital)
    and (p_financial_year is null or (
      p_financial_year ~ '^[0-9]{4}-[0-9]{2}$'
      and (fy.start_year::text || '-' || lpad(((fy.start_year + 1) % 100)::text, 2, '0')) = p_financial_year
    ))
), per_child as (
  select hospital_child_id, child_name, count(*)::bigint as value
  from filtered group by hospital_child_id, child_name
), monthly as (
  select month_label as label, count(*)::bigint as value,
    min((calendar_month + 8) % 12) as sort_order
  from filtered where session_date is not null group by month_label
), by_hospital as (
  select coalesce(hospital_name::text, 'Unknown') as label, count(*)::bigint as value
  from filtered group by hospital_name
), top_children as (
  select child_name as label, value, row_number() over(order by value desc, child_name asc) as position
  from per_child
), chart_rows as (
  select 'monthly'::text as chart_name,label,value,sort_order,null::text as series from monthly
  union all select 'hospital',label,value,0,null::text from by_hospital
  union all select 'top_children',label,value,0,null::text from top_children where position <= 10
)
select jsonb_build_object(
  'summary', (select jsonb_build_object(
    'total_children', count(distinct hospital_child_id),
    'total_sessions', count(*),
    'sessions_this_month', count(*) filter (where session_date >= date_trunc('month', current_date) and session_date < date_trunc('month', current_date) + interval '1 month')
  ) from filtered),
  'charts', coalesce((select jsonb_agg(jsonb_build_object('chart_name',chart_name,'label',label,'value',value,'sort_order',sort_order,'series',series) order by chart_name,sort_order,label) from chart_rows),'[]'::jsonb),
  'financial_years', coalesce((select jsonb_agg(financial_year order by start_year desc) from available_years),'[]'::jsonb)
);
$$;
revoke all on function public.hospital_sessions_dashboard_data(public.month_enum, public.hospital_enum, text) from public;
grant execute on function public.hospital_sessions_dashboard_data(public.month_enum, public.hospital_enum, text) to anon, authenticated;

create or replace view public.hospital_sessions_records
with (security_invoker = true)
as
select f.hospital_session_feedback_id, f.hospital_child_id, c.child_name,
  f.session_date, to_char(f.session_date, 'FMMonth') as month,
  f.hospital_name, f.ward,
  case when f.session_date is null then null
    when extract(month from f.session_date)::integer >= 4 then
      extract(year from f.session_date)::integer::text || '-' || lpad(((extract(year from f.session_date)::integer + 1) % 100)::text, 2, '0')
    else (extract(year from f.session_date)::integer - 1)::text || '-' || lpad((extract(year from f.session_date)::integer % 100)::text, 2, '0')
  end as financial_year
from public.hospital_session_feedback f
join public.hospital_children c using (hospital_child_id);
grant select on public.hospital_sessions_records to anon, authenticated;
