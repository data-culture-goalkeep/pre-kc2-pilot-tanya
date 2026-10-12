-- TEST ONLY - tighten before real data
-- Hospital children remain separate from beneficiaries and keep H-#### identifiers.
begin;

alter table public.hospital_children enable row level security;
alter table public.hospital_session_feedback enable row level security;
grant select, insert on public.hospital_children, public.hospital_session_feedback to anon, authenticated;

create policy hospital_children_test_select on public.hospital_children
  for select to anon, authenticated using (true);
create policy hospital_children_test_insert on public.hospital_children
  for insert to anon, authenticated with check (
    source_file = 'Happy Feet Dashboard' and source_sheet = 'Manual Entry' and source_row > 0
  );
create policy hospital_session_feedback_test_select on public.hospital_session_feedback
  for select to anon, authenticated using (true);
create policy hospital_session_feedback_test_insert on public.hospital_session_feedback
  for insert to anon, authenticated with check (
    source_file = 'Happy Feet Dashboard' and source_sheet = 'Manual Entry' and source_row > 0
  );

-- Align once with any existing pilot IDs, then rely on nextval for concurrent inserts.
select setval('public.hospital_child_id_seq'::regclass,
  greatest(coalesce((select max(substring(hospital_child_id from '^H-([0-9]+)$')::bigint) from public.hospital_children), 0) + 1, 1), false);

create or replace function public.next_hospital_child_id()
returns text
language sql volatile security definer set search_path = pg_catalog, public
as $$
  select 'H-' || case when n < 10000 then lpad(n::text, 4, '0') else n::text end
  from (select nextval('public.hospital_child_id_seq'::regclass) as n) generated;
$$;
revoke all on function public.next_hospital_child_id() from public;
grant execute on function public.next_hospital_child_id() to anon, authenticated;

create or replace function public.insert_hospital_session_entry(
  p_existing_child_id text,
  p_new_child_name text,
  p_child_source_row integer,
  p_session_source_row integer,
  p_session jsonb
)
returns text
language plpgsql volatile security invoker set search_path = public, pg_temp
as $$
declare
  child_id text;
begin
  if nullif(btrim(p_existing_child_id), '') is null then
    if nullif(btrim(p_new_child_name), '') is null then raise exception 'A child name is required.'; end if;
    child_id := public.next_hospital_child_id();
    insert into public.hospital_children (hospital_child_id, child_name, source_file, source_sheet, source_row)
    values (child_id, btrim(p_new_child_name), 'Happy Feet Dashboard', 'Manual Entry', p_child_source_row);
  else
    child_id := btrim(p_existing_child_id);
    perform 1 from public.hospital_children where hospital_child_id = child_id;
    if not found then raise exception 'Hospital child ID was not found.'; end if;
  end if;

  insert into public.hospital_session_feedback (
    hospital_child_id, facilitator, session_date, diagnosis, hospital_name, ward,
    ritual, warm_up, core_activity, closure, feeling_on_entry, feeling_during_activity,
    felt_relaxed, activity_fun, would_attend_again, notes, source_file, source_sheet, source_row
  ) values (
    child_id, nullif(p_session->>'facilitator',''), nullif(p_session->>'session_date','')::date,
    nullif(p_session->>'diagnosis',''), nullif(p_session->>'hospital_name','')::public.hospital_enum,
    nullif(p_session->>'ward','')::public.ward_enum, nullif(p_session->>'ritual',''),
    nullif(p_session->>'warm_up',''), nullif(p_session->>'core_activity',''), nullif(p_session->>'closure',''),
    nullif(p_session->>'feeling_on_entry',''), nullif(p_session->>'feeling_during_activity',''),
    nullif(p_session->>'felt_relaxed',''), nullif(p_session->>'activity_fun',''), nullif(p_session->>'would_attend_again',''),
    nullif(p_session->>'notes',''), 'Happy Feet Dashboard', 'Manual Entry', p_session_source_row
  );
  return child_id;
end;
$$;
revoke all on function public.insert_hospital_session_entry(text, text, integer, integer, jsonb) from public;
grant execute on function public.insert_hospital_session_entry(text, text, integer, integer, jsonb) to anon, authenticated;

create or replace function public.hospital_sessions_dashboard_data(
  p_month public.month_enum default null,
  p_hospital public.hospital_enum default null
)
returns jsonb
language sql stable security invoker set search_path = public
as $$
with filtered as (
  select f.hospital_session_feedback_id, f.hospital_child_id, c.child_name,
    f.session_date, f.hospital_name,
    extract(month from f.session_date)::integer as month_order,
    to_char(f.session_date, 'FMMonth') as month_label
  from public.hospital_session_feedback f
  join public.hospital_children c using (hospital_child_id)
  where (p_month is null or to_char(f.session_date, 'FMMonth') = p_month::text)
    and (p_hospital is null or f.hospital_name = p_hospital)
),
per_child as (
  select hospital_child_id, child_name, count(*)::bigint as value
  from filtered group by hospital_child_id, child_name
),
monthly as (
  select month_label as label, count(*)::bigint as value, min(month_order) as sort_order
  from filtered where session_date is not null group by month_label
),
by_hospital as (
  select coalesce(hospital_name::text, 'Unknown') as label, count(*)::bigint as value
  from filtered group by hospital_name
),
top_children as (
  select child_name as label, value, row_number() over(order by value desc, child_name asc) as position
  from per_child
),
chart_rows as (
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
  'charts', coalesce((select jsonb_agg(jsonb_build_object('chart_name',chart_name,'label',label,'value',value,'sort_order',sort_order,'series',series) order by chart_name,sort_order,label) from chart_rows),'[]'::jsonb)
);
$$;
revoke all on function public.hospital_sessions_dashboard_data(public.month_enum, public.hospital_enum) from public;
grant execute on function public.hospital_sessions_dashboard_data(public.month_enum, public.hospital_enum) to anon, authenticated;

create or replace view public.hospital_sessions_records
with (security_invoker = true)
as
select f.hospital_session_feedback_id, f.hospital_child_id, c.child_name,
  f.session_date, to_char(f.session_date, 'FMMonth') as month,
  f.hospital_name, f.ward
from public.hospital_session_feedback f
join public.hospital_children c using (hospital_child_id);
grant select on public.hospital_sessions_records to anon, authenticated;
commit;
