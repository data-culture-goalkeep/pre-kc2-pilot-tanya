-- TEST ONLY - tighten before real data
-- Grid editing, response-value expansion, and assessment-picker support. Review before applying.

alter type public.attendance_code_enum add value if not exists 'A';
alter type public.attendance_code_enum add value if not exists 'H';

-- Do not discard or merge the duplicate source rows automatically. Add the composite
-- key only when the existing data is clean; the dashboard marks duplicate groups.
do $$
begin
  if exists (
    select 1 from public.daycare_attendance
    group by beneficiary_id, month, financial_year
    having count(*) > 1
  ) then
    raise notice 'Skipped daycare_attendance_beneficiary_month_fy_uq: reconcile duplicate beneficiary/month/financial_year rows first.';
  elsif not exists (
    select 1 from pg_constraint c
    where c.conrelid = 'public.daycare_attendance'::regclass
      and c.contype = 'u'
      and pg_get_constraintdef(c.oid) = 'UNIQUE (beneficiary_id, month, financial_year)'
  ) then
    alter table public.daycare_attendance
      add constraint daycare_attendance_beneficiary_month_fy_uq unique (beneficiary_id, month, financial_year);
  end if;
end;
$$;

grant update (day_01, day_02, day_03, day_04, day_05, day_06, day_07, day_08, day_09, day_10,
  day_11, day_12, day_13, day_14, day_15, day_16, day_17, day_18, day_19, day_20,
  day_21, day_22, day_23, day_24, day_25, day_26, day_27, day_28, day_29, day_30, day_31,
  total_present) on public.daycare_attendance to anon, authenticated;

create policy daycare_attendance_test_update on public.daycare_attendance
  for update to anon, authenticated using (true) with check (true);

create or replace function public.daycare_attendance_grid_data(
  p_month public.month_enum,
  p_financial_year text,
  p_program public.program_enum default 'Daycare'
)
returns jsonb
language sql stable security invoker set search_path = public
as $$
with selected_rows as (
  select b.beneficiary_id, b.name_of_child, a.attendance_id, a.source_row,
    a.day_01, a.day_02, a.day_03, a.day_04, a.day_05, a.day_06, a.day_07, a.day_08, a.day_09, a.day_10,
    a.day_11, a.day_12, a.day_13, a.day_14, a.day_15, a.day_16, a.day_17, a.day_18, a.day_19, a.day_20,
    a.day_21, a.day_22, a.day_23, a.day_24, a.day_25, a.day_26, a.day_27, a.day_28, a.day_29, a.day_30, a.day_31,
    count(a.attendance_id) over (partition by b.beneficiary_id) as duplicate_count,
    row_number() over (partition by b.beneficiary_id order by a.source_row nulls last, a.attendance_id) as row_rank
  from public.beneficiaries b
  left join public.daycare_attendance a
    on a.beneficiary_id = b.beneficiary_id and a.month = p_month and a.financial_year = p_financial_year
  where b.program = p_program
)
select jsonb_build_object('rows', coalesce(jsonb_agg(jsonb_build_object(
  'beneficiary_id', beneficiary_id, 'name_of_child', name_of_child,
  'attendance_id', attendance_id, 'duplicate_count', duplicate_count,
  'day_01', day_01::text, 'day_02', day_02::text, 'day_03', day_03::text, 'day_04', day_04::text, 'day_05', day_05::text,
  'day_06', day_06::text, 'day_07', day_07::text, 'day_08', day_08::text, 'day_09', day_09::text, 'day_10', day_10::text,
  'day_11', day_11::text, 'day_12', day_12::text, 'day_13', day_13::text, 'day_14', day_14::text, 'day_15', day_15::text,
  'day_16', day_16::text, 'day_17', day_17::text, 'day_18', day_18::text, 'day_19', day_19::text, 'day_20', day_20::text,
  'day_21', day_21::text, 'day_22', day_22::text, 'day_23', day_23::text, 'day_24', day_24::text, 'day_25', day_25::text,
  'day_26', day_26::text, 'day_27', day_27::text, 'day_28', day_28::text, 'day_29', day_29::text, 'day_30', day_30::text,
  'day_31', day_31::text
) order by beneficiary_id) filter (where row_rank = 1), '[]'::jsonb))
from selected_rows;
$$;
revoke all on function public.daycare_attendance_grid_data(public.month_enum, text, public.program_enum) from public;
grant execute on function public.daycare_attendance_grid_data(public.month_enum, text, public.program_enum) to anon, authenticated;

create or replace function public.save_daycare_attendance_grid(
  p_month public.month_enum,
  p_financial_year text,
  p_program public.program_enum,
  p_rows jsonb
)
returns integer
language plpgsql volatile security invoker set search_path = public, pg_temp
as $$
declare
  rec record;
  existing_count integer;
  existing_id uuid;
  saved_count integer := 0;
  affected_count integer;
begin
  if p_financial_year !~ '^[0-9]{4}-[0-9]{2}$' then raise exception 'Financial year must use YYYY-YY format.'; end if;
  if jsonb_typeof(p_rows) <> 'array' then raise exception 'Grid changes must be a JSON array.'; end if;
  if jsonb_array_length(p_rows) > 2000 then raise exception 'Too many attendance rows in one save.'; end if;

  for rec in
    select * from jsonb_to_recordset(p_rows) as x(
      beneficiary_id text, source_row integer,
      day_01 public.attendance_code_enum, day_02 public.attendance_code_enum, day_03 public.attendance_code_enum, day_04 public.attendance_code_enum, day_05 public.attendance_code_enum,
      day_06 public.attendance_code_enum, day_07 public.attendance_code_enum, day_08 public.attendance_code_enum, day_09 public.attendance_code_enum, day_10 public.attendance_code_enum,
      day_11 public.attendance_code_enum, day_12 public.attendance_code_enum, day_13 public.attendance_code_enum, day_14 public.attendance_code_enum, day_15 public.attendance_code_enum,
      day_16 public.attendance_code_enum, day_17 public.attendance_code_enum, day_18 public.attendance_code_enum, day_19 public.attendance_code_enum, day_20 public.attendance_code_enum,
      day_21 public.attendance_code_enum, day_22 public.attendance_code_enum, day_23 public.attendance_code_enum, day_24 public.attendance_code_enum, day_25 public.attendance_code_enum,
      day_26 public.attendance_code_enum, day_27 public.attendance_code_enum, day_28 public.attendance_code_enum, day_29 public.attendance_code_enum, day_30 public.attendance_code_enum,
      day_31 public.attendance_code_enum, total_present integer
    ) order by beneficiary_id
  loop
    if rec.beneficiary_id is null or rec.source_row is null or rec.source_row < 1 then raise exception 'A beneficiary and positive generated source_row are required.'; end if;
    if not exists (select 1 from public.beneficiaries b where b.beneficiary_id = rec.beneficiary_id and b.program = p_program) then
      raise exception 'Beneficiary % is not in the selected program.', rec.beneficiary_id;
    end if;

    perform pg_advisory_xact_lock(hashtextextended(rec.beneficiary_id || '|' || p_month::text || '|' || p_financial_year, 0));
    select count(*)::integer into existing_count from public.daycare_attendance a
      where a.beneficiary_id = rec.beneficiary_id and a.month = p_month and a.financial_year = p_financial_year;
    if existing_count > 1 then
      raise exception 'Attendance row for beneficiary % has duplicate records. Reconcile those records before saving.', rec.beneficiary_id;
    elsif existing_count = 1 then
      select a.attendance_id into existing_id from public.daycare_attendance a
        where a.beneficiary_id = rec.beneficiary_id and a.month = p_month and a.financial_year = p_financial_year
        order by a.source_row nulls last, a.attendance_id limit 1 for update;
      update public.daycare_attendance set
        day_01=rec.day_01, day_02=rec.day_02, day_03=rec.day_03, day_04=rec.day_04, day_05=rec.day_05,
        day_06=rec.day_06, day_07=rec.day_07, day_08=rec.day_08, day_09=rec.day_09, day_10=rec.day_10,
        day_11=rec.day_11, day_12=rec.day_12, day_13=rec.day_13, day_14=rec.day_14, day_15=rec.day_15,
        day_16=rec.day_16, day_17=rec.day_17, day_18=rec.day_18, day_19=rec.day_19, day_20=rec.day_20,
        day_21=rec.day_21, day_22=rec.day_22, day_23=rec.day_23, day_24=rec.day_24, day_25=rec.day_25,
        day_26=rec.day_26, day_27=rec.day_27, day_28=rec.day_28, day_29=rec.day_29, day_30=rec.day_30,
        day_31=rec.day_31, total_present=rec.total_present
      where attendance_id=existing_id;
      get diagnostics affected_count = row_count;
    else
      insert into public.daycare_attendance (
        beneficiary_id, name_of_child, month, financial_year,
        day_01, day_02, day_03, day_04, day_05, day_06, day_07, day_08, day_09, day_10,
        day_11, day_12, day_13, day_14, day_15, day_16, day_17, day_18, day_19, day_20,
        day_21, day_22, day_23, day_24, day_25, day_26, day_27, day_28, day_29, day_30, day_31,
        total_present, source_file, source_sheet, source_row
      ) select b.beneficiary_id, b.name_of_child, p_month, p_financial_year,
        rec.day_01, rec.day_02, rec.day_03, rec.day_04, rec.day_05, rec.day_06, rec.day_07, rec.day_08, rec.day_09, rec.day_10,
        rec.day_11, rec.day_12, rec.day_13, rec.day_14, rec.day_15, rec.day_16, rec.day_17, rec.day_18, rec.day_19, rec.day_20,
        rec.day_21, rec.day_22, rec.day_23, rec.day_24, rec.day_25, rec.day_26, rec.day_27, rec.day_28, rec.day_29, rec.day_30, rec.day_31,
        rec.total_present, 'Happy Feet Dashboard', 'Manual Entry', rec.source_row
      from public.beneficiaries b where b.beneficiary_id = rec.beneficiary_id and b.program = p_program;
      get diagnostics affected_count = row_count;
    end if;
    if affected_count <> 1 then raise exception 'Attendance row for beneficiary % was not saved.', rec.beneficiary_id; end if;
    saved_count := saved_count + 1;
  end loop;
  return saved_count;
end;
$$;
revoke all on function public.save_daycare_attendance_grid(public.month_enum, text, public.program_enum, jsonb) from public;
grant execute on function public.save_daycare_attendance_grid(public.month_enum, text, public.program_enum, jsonb) to anon, authenticated;

-- Refresh the score-card/chart function for the new codes and financial-year filter.
create or replace function public.daycare_attendance_dashboard_data(
  p_month public.month_enum default null,
  p_program public.program_enum default null,
  p_beneficiary text default null,
  p_financial_year text default null
)
returns jsonb language sql stable security invoker set search_path = public as $$
with filtered as (
  select a.attendance_id, a.beneficiary_id, a.month, a.financial_year, b.name_of_child, b.program,
    array_position(enum_range(null::public.month_enum)::text[], a.month::text) as month_order,
    extract(day from (make_date(substring(a.financial_year from '^[0-9]{4}')::integer + case when array_position(enum_range(null::public.month_enum)::text[], a.month::text) <= 3 then 1 else 0 end,
      array_position(enum_range(null::public.month_enum)::text[], a.month::text), 1) + interval '1 month - 1 day'))::integer as days_in_month,
    a.day_01::text as day_01, a.day_02::text as day_02, a.day_03::text as day_03, a.day_04::text as day_04, a.day_05::text as day_05,
    a.day_06::text as day_06, a.day_07::text as day_07, a.day_08::text as day_08, a.day_09::text as day_09, a.day_10::text as day_10,
    a.day_11::text as day_11, a.day_12::text as day_12, a.day_13::text as day_13, a.day_14::text as day_14, a.day_15::text as day_15,
    a.day_16::text as day_16, a.day_17::text as day_17, a.day_18::text as day_18, a.day_19::text as day_19, a.day_20::text as day_20,
    a.day_21::text as day_21, a.day_22::text as day_22, a.day_23::text as day_23, a.day_24::text as day_24, a.day_25::text as day_25,
    a.day_26::text as day_26, a.day_27::text as day_27, a.day_28::text as day_28, a.day_29::text as day_29, a.day_30::text as day_30, a.day_31::text as day_31
  from public.daycare_attendance a join public.beneficiaries b on b.beneficiary_id=a.beneficiary_id
  where (p_month is null or a.month=p_month) and (p_program is null or b.program=p_program)
    and (p_financial_year is null or a.financial_year=p_financial_year)
    and (p_beneficiary is null or a.beneficiary_id ilike '%'||p_beneficiary||'%' or coalesce(a.name_of_child,b.name_of_child,'') ilike '%'||p_beneficiary||'%')
), counts as (
  select f.attendance_id,
    count(*) filter(where d.code='P')::integer as p_days,
    count(*) filter(where d.code='A')::integer as a_days,
    count(*) filter(where d.code='H')::integer as h_days,
    count(*) filter(where d.code='NA')::integer as na_days
  from filtered f cross join lateral (values
    (1,f.day_01),(2,f.day_02),(3,f.day_03),(4,f.day_04),(5,f.day_05),(6,f.day_06),(7,f.day_07),(8,f.day_08),(9,f.day_09),(10,f.day_10),
    (11,f.day_11),(12,f.day_12),(13,f.day_13),(14,f.day_14),(15,f.day_15),(16,f.day_16),(17,f.day_17),(18,f.day_18),(19,f.day_19),(20,f.day_20),
    (21,f.day_21),(22,f.day_22),(23,f.day_23),(24,f.day_24),(25,f.day_25),(26,f.day_26),(27,f.day_27),(28,f.day_28),(29,f.day_29),(30,f.day_30),(31,f.day_31)
  ) as d(day_number,code) where d.day_number<=f.days_in_month group by f.attendance_id
), rows as (
  select f.*,c.p_days,c.a_days,c.h_days,c.na_days,round(100.0*c.p_days/nullif(f.days_in_month-c.h_days-c.na_days,0),1) as attendance_percent
  from filtered f join counts c using(attendance_id)
), monthly as (
  select month::text as label,round(avg(attendance_percent),1) as value,min(month_order) as sort_order from rows group by month
), program_rows as (
  select coalesce(program::text,'Unknown') as label,count(distinct beneficiary_id)::numeric as value from rows group by program
), bands as (
  select case when attendance_percent is null then 'No denominator' when attendance_percent<50 then 'Below 50%' when attendance_percent<=75 then '50–75%' else 'Above 75%' end as label,
    count(distinct beneficiary_id)::numeric as value,
    case when attendance_percent is null then 4 when attendance_percent<50 then 1 when attendance_percent<=75 then 2 else 3 end as sort_order
  from rows group by 1,3
), quarterly_rows as (
  select q.quarter::text as label,
    count(*) filter(where q.grocery_support_required_date is not null or q.medicine_support_required_date is not null or q.one_to_one_therapy_required_date is not null or q.intensive_intervention_psychiatric_medicines_required_date is not null or q.educational_support_required_date is not null)::numeric as inputs,
    count(*) filter(where q.grocery_support_provided_date is not null or q.medicine_support_provided_date is not null or q.one_to_one_therapy_provided_date is not null or q.intensive_intervention_psychiatric_medicines_provided_date is not null or q.educational_provided_required_date is not null)::numeric as outputs
  from public.daycare_quarterly q join public.beneficiaries b on b.beneficiary_id=q.beneficiary_id
  where (p_program is null or b.program=p_program) and (p_financial_year is null or q.financial_year=p_financial_year)
    and (p_beneficiary is null or q.beneficiary_id ilike '%'||p_beneficiary||'%' or coalesce(q.name_of_child,b.name_of_child,'') ilike '%'||p_beneficiary||'%')
    and (p_month is null or q.quarter=case when array_position(enum_range(null::public.month_enum)::text[],p_month::text)<=3 then 'Q1'::public.quarter_enum when array_position(enum_range(null::public.month_enum)::text[],p_month::text)<=6 then 'Q2'::public.quarter_enum when array_position(enum_range(null::public.month_enum)::text[],p_month::text)<=9 then 'Q3'::public.quarter_enum else 'Q4'::public.quarter_enum end)
  group by q.quarter
), chart_rows as (
  select 'monthly_attendance'::text as chart_name,label,value::numeric as value,sort_order::integer as sort_order,null::text as series from monthly
  union all select 'program',label,value,0,null::text from program_rows
  union all select 'attendance_band',label,value,sort_order,null::text from bands
  union all select 'quarterly',label,inputs,0,'Inputs'::text from quarterly_rows
  union all select 'quarterly',label,outputs,0,'Outputs'::text from quarterly_rows
)
select jsonb_build_object(
  'summary',(select jsonb_build_object('average_attendance_percent',coalesce(round(avg(attendance_percent),1),0),
    'children_with_data',count(distinct beneficiary_id) filter(where p_days+a_days+h_days+na_days>0),
    'children_below_50',count(distinct beneficiary_id) filter(where attendance_percent<50)) from rows),
  'charts',coalesce((select jsonb_agg(jsonb_build_object('chart_name',chart_name,'label',label,'value',value,'sort_order',sort_order,'series',series) order by chart_name,sort_order,label,series) from chart_rows),'[]'::jsonb)
);
$$;
revoke all on function public.daycare_attendance_dashboard_data(public.month_enum, public.program_enum, text, text) from public;
grant execute on function public.daycare_attendance_dashboard_data(public.month_enum, public.program_enum, text, text) to anon, authenticated;
