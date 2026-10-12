-- TEST ONLY - tighten before real data
begin;

alter table public.rosenberg_assessment_history enable row level security;
alter table public.stirling_assessment_history enable row level security;
grant select, insert on public.rosenberg_assessment_history, public.stirling_assessment_history to anon, authenticated;
create policy rosenberg_assessment_test_select on public.rosenberg_assessment_history for select to anon, authenticated using (true);
create policy rosenberg_assessment_test_insert on public.rosenberg_assessment_history for insert to anon, authenticated with check (source_file = 'Happy Feet Dashboard' and source_sheet = 'Manual Entry' and source_row > 0);
create policy stirling_assessment_test_select on public.stirling_assessment_history for select to anon, authenticated using (true);
create policy stirling_assessment_test_insert on public.stirling_assessment_history for insert to anon, authenticated with check (source_file = 'Happy Feet Dashboard' and source_sheet = 'Manual Entry' and source_row > 0);

create or replace function public.assessments_dashboard_data(p_test text default null, p_phase text default null, p_month public.month_enum default null)
returns jsonb language sql stable security invoker set search_path = public as $$
with r as (
 select * from public.rosenberg_assessment_history where (p_test is null or p_test = 'Rosenberg') and p_phase is null and (p_month is null or to_char(assessment_date,'FMMonth')=p_month::text)
), s as (
 select * from public.stirling_assessment_history where (p_test is null or p_test = 'Stirling') and (p_phase is null or test_type::text=p_phase) and (p_month is null or to_char(assessment_date,'FMMonth')=p_month::text)
), rs as (
 select 'Rosenberg'::text as test, 'q'||q as question, raw as answer, count(*)::bigint as value
 from r cross join lateral (values (1,q1_raw),(2,q2_raw),(3,q3_raw),(4,q4_raw),(5,q5_raw),(6,q6_raw),(7,q7_raw),(8,q8_raw),(9,q9_raw),(10,q10_raw)) v(q,raw)
 where raw is not null group by q,raw
), ss as (
 select 'Stirling'::text as test, 'Score '||score::text as question, test_type::text as answer, count(*)::bigint as value
 from s cross join lateral (values (1,q1),(2,q2),(3,q3),(4,q4),(5,q5),(6,q6),(7,q7),(8,q8),(9,q9),(10,q10),(11,q11),(12,q12),(13,q13),(14,q14),(15,q15)) v(q,score)
 where score is not null group by score,test_type
), charts as (
 select test as chart_name, question as label, value::numeric, question as series, answer as detail from rs
 union all select test, question, value::numeric, answer, answer from ss
), all_assessments as (
 select beneficiary_id, assessment_date from r union all select beneficiary_id, assessment_date from s
), paired as (
 select beneficiary_id from s group by beneficiary_id having bool_or(test_type='Pre') and bool_or(test_type='Post')
)
select jsonb_build_object(
 'summary', jsonb_build_object(
  'assessments_recorded',(select count(*) from r)+(select count(*) from s),
  'children_assessed',(select count(distinct beneficiary_id) from all_assessments),
  'pre_post_pairs',(select count(*) from paired)
 ),
 'charts',coalesce((select jsonb_agg(jsonb_build_object('chart_name',chart_name,'label',label,'value',value,'series',series,'detail',detail) order by chart_name,label,series,detail) from charts),'[]'::jsonb)
);
$$;
revoke all on function public.assessments_dashboard_data(text,text,public.month_enum) from public;
grant execute on function public.assessments_dashboard_data(text,text,public.month_enum) to anon, authenticated;

create or replace view public.assessments_records with (security_invoker=true) as
select 'Rosenberg'::text as test_type, null::text as phase, rosenberg_assessment_id::text as record_id, beneficiary_id, coalesce(name_of_child,'') as name_of_child, assessment_date, to_char(assessment_date,'FMMonth') as month, notes
from public.rosenberg_assessment_history
union all
select 'Stirling', test_type::text, stirling_assessment_id::text, beneficiary_id, coalesce(name_of_child,''), assessment_date, to_char(assessment_date,'FMMonth'), notes
from public.stirling_assessment_history;
grant select on public.assessments_records to anon, authenticated;
commit;
