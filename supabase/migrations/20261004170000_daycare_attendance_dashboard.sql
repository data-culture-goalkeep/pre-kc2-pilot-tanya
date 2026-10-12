-- TEST ONLY - tighten before real data
-- Anonymous access below is limited to synthetic/manual entries while this pilot is used with dummy data.
begin;

alter table public.daycare_attendance enable row level security;
alter table public.daycare_quarterly enable row level security;
grant select, insert on public.daycare_attendance, public.daycare_quarterly to anon, authenticated;

create policy daycare_attendance_test_select on public.daycare_attendance
  for select to anon, authenticated using (true);
create policy daycare_attendance_test_insert on public.daycare_attendance
  for insert to anon, authenticated with check (
    source_file = 'Happy Feet Dashboard' and source_sheet = 'Manual Entry' and source_row > 0
  );
create policy daycare_quarterly_test_select on public.daycare_quarterly
  for select to anon, authenticated using (true);
create policy daycare_quarterly_test_insert on public.daycare_quarterly
  for insert to anon, authenticated with check (
    source_file = 'Happy Feet Dashboard' and source_sheet = 'Manual Entry' and source_row > 0
  );

create or replace function public.daycare_attendance_dashboard_data(
  p_month public.month_enum default null,
  p_program public.program_enum default null,
  p_beneficiary text default null
)
returns jsonb
language sql stable security invoker set search_path = public
as $$
with filtered as (
  select a.attendance_id, a.beneficiary_id, a.month, a.financial_year,
    b.name_of_child, b.program,
    array_position(enum_range(null::public.month_enum)::text[], a.month::text) as month_order,
    extract(day from (make_date(substring(a.financial_year from '^[0-9]{4}')::integer + case when array_position(enum_range(null::public.month_enum)::text[], a.month::text) <= 3 then 1 else 0 end,
      array_position(enum_range(null::public.month_enum)::text[], a.month::text), 1)
      + interval '1 month - 1 day'))::integer as days_in_month,
    a.day_01::text as day_01, a.day_02::text as day_02, a.day_03::text as day_03,
    a.day_04::text as day_04, a.day_05::text as day_05, a.day_06::text as day_06,
    a.day_07::text as day_07, a.day_08::text as day_08, a.day_09::text as day_09,
    a.day_10::text as day_10, a.day_11::text as day_11, a.day_12::text as day_12,
    a.day_13::text as day_13, a.day_14::text as day_14, a.day_15::text as day_15,
    a.day_16::text as day_16, a.day_17::text as day_17, a.day_18::text as day_18,
    a.day_19::text as day_19, a.day_20::text as day_20, a.day_21::text as day_21,
    a.day_22::text as day_22, a.day_23::text as day_23, a.day_24::text as day_24,
    a.day_25::text as day_25, a.day_26::text as day_26, a.day_27::text as day_27,
    a.day_28::text as day_28, a.day_29::text as day_29, a.day_30::text as day_30,
    a.day_31::text as day_31
  from public.daycare_attendance a
  join public.beneficiaries b on b.beneficiary_id = a.beneficiary_id
  where (p_month is null or a.month = p_month)
    and (p_program is null or b.program = p_program)
    and (p_beneficiary is null or a.beneficiary_id ilike '%' || p_beneficiary || '%'
      or coalesce(a.name_of_child, b.name_of_child, '') ilike '%' || p_beneficiary || '%')
),
counts as (
  select f.attendance_id,
    count(*) filter (where d.code = 'P')::integer as present_days,
    count(*) filter (where d.code = 'NA')::integer as unavailable_days
  from filtered f
  cross join lateral (values
    (1,f.day_01),(2,f.day_02),(3,f.day_03),(4,f.day_04),(5,f.day_05),(6,f.day_06),(7,f.day_07),
    (8,f.day_08),(9,f.day_09),(10,f.day_10),(11,f.day_11),(12,f.day_12),(13,f.day_13),(14,f.day_14),
    (15,f.day_15),(16,f.day_16),(17,f.day_17),(18,f.day_18),(19,f.day_19),(20,f.day_20),(21,f.day_21),
    (22,f.day_22),(23,f.day_23),(24,f.day_24),(25,f.day_25),(26,f.day_26),(27,f.day_27),(28,f.day_28),
    (29,f.day_29),(30,f.day_30),(31,f.day_31)
  ) as d(day_number, code)
  where d.day_number <= f.days_in_month
  group by f.attendance_id
),
rows as (
  select f.*, c.present_days, c.unavailable_days,
    round(100.0 * c.present_days / nullif(f.days_in_month - c.unavailable_days, 0), 1) as attendance_percent
  from filtered f join counts c using (attendance_id)
),
monthly as (
  select month::text as label, round(avg(attendance_percent), 1) as value, min(month_order) as sort_order
  from rows group by month
),
program_rows as (
  select coalesce(program::text, 'Unknown') as label, count(distinct beneficiary_id)::numeric as value from rows group by program
),
bands as (
  select case when attendance_percent is null then 'No denominator'
    when attendance_percent < 50 then 'Below 50%'
    when attendance_percent <= 75 then '50–75%'
    else 'Above 75%' end as label,
    count(distinct beneficiary_id)::numeric as value,
    case when attendance_percent is null then 4 when attendance_percent < 50 then 1 when attendance_percent <= 75 then 2 else 3 end as sort_order
  from rows group by 1,3
),
quarterly_rows as (
  select q.quarter::text as label,
    count(*) filter (where q.grocery_support_required_date is not null or q.medicine_support_required_date is not null or q.one_to_one_therapy_required_date is not null or q.intensive_intervention_psychiatric_medicines_required_date is not null or q.educational_support_required_date is not null)::numeric as inputs,
    count(*) filter (where q.grocery_support_provided_date is not null or q.medicine_support_provided_date is not null or q.one_to_one_therapy_provided_date is not null or q.intensive_intervention_psychiatric_medicines_provided_date is not null or q.educational_provided_required_date is not null)::numeric as outputs
  from public.daycare_quarterly q join public.beneficiaries b on b.beneficiary_id = q.beneficiary_id
  where (p_program is null or b.program = p_program)
    and (p_beneficiary is null or q.beneficiary_id ilike '%' || p_beneficiary || '%' or coalesce(q.name_of_child,b.name_of_child,'') ilike '%' || p_beneficiary || '%')
    and (p_month is null or q.quarter = case when array_position(enum_range(null::public.month_enum)::text[], p_month::text) <= 3 then 'Q1'::public.quarter_enum when array_position(enum_range(null::public.month_enum)::text[], p_month::text) <= 6 then 'Q2'::public.quarter_enum when array_position(enum_range(null::public.month_enum)::text[], p_month::text) <= 9 then 'Q3'::public.quarter_enum else 'Q4'::public.quarter_enum end)
  group by q.quarter
),
chart_rows as (
  select 'monthly_attendance'::text as chart_name, label, value::numeric as value, sort_order::integer as sort_order, null::text as series from monthly
  union all select 'program', label, value, 0, null::text from program_rows
  union all select 'attendance_band', label, value, sort_order, null::text from bands
  union all select 'quarterly', label, inputs, 0, 'Inputs'::text from quarterly_rows
  union all select 'quarterly', label, outputs, 0, 'Outputs'::text from quarterly_rows
)
select jsonb_build_object(
  'summary', (select jsonb_build_object(
    'average_attendance_percent', coalesce(round(avg(attendance_percent), 1), 0),
    'children_with_data', count(distinct beneficiary_id) filter (where present_days + unavailable_days > 0),
    'children_below_50', count(distinct beneficiary_id) filter (where attendance_percent < 50)
  ) from rows),
  'charts', coalesce((select jsonb_agg(jsonb_build_object('chart_name',chart_name,'label',label,'value',value,'sort_order',sort_order,'series',series) order by chart_name,sort_order,label,series) from chart_rows),'[]'::jsonb)
);
$$;

revoke all on function public.daycare_attendance_dashboard_data(public.month_enum, public.program_enum, text) from public;
grant execute on function public.daycare_attendance_dashboard_data(public.month_enum, public.program_enum, text) to anon, authenticated;
commit;
