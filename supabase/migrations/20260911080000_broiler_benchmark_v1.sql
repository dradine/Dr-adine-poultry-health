-- ADINE POULTRY HEALTH CENTER — BROILER BENCHMARK V1
-- Independent flock-level peer benchmarking. Active/closed/archived flocks are eligible.
-- Statistical unit = flock. No one-flock-per-farm rule.

alter table public.farms add column if not exists region text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname='farms_region_allowed_chk' and conrelid='public.farms'::regclass) then
    alter table public.farms add constraint farms_region_allowed_chk check (region is null or region in ('north','south','east','west','center'));
  end if;
end $$;
create index if not exists idx_flocks_benchmark_v1 on public.flocks(production_type,genetics,strain,placement_date,created_at);
create index if not exists idx_weekly_records_benchmark_v1 on public.weekly_records(flock_id,age_days,created_at);
create index if not exists idx_farms_benchmark_region_v1 on public.farms(region);

drop function if exists public.get_flock_benchmark_v6(uuid,text,integer);
drop function if exists public.get_flock_metric_history_v6(uuid,text,integer);

create or replace function public.get_broiler_benchmark_v1(p_flock_id uuid,p_age_days integer default null,p_age_window_days integer default 3,p_recent_limit integer default 30)
returns jsonb language plpgsql security definer set search_path='' stable as $$
declare
 v_user uuid:=(select auth.uid()); v_farm_id uuid; v_target_age integer; v_window integer:=greatest(1,least(coalesce(p_age_window_days,3),7));
 v_type text;v_genetics text;v_strain text;v_region text;v_flock_name text;v_cohorts jsonb;
begin
 if v_user is null then raise exception 'احراز هویت الزامی است';end if;
 select f.farm_id,lower(trim(coalesce(f.production_type,''))),nullif(lower(trim(coalesce(f.genetics,''))),''),nullif(lower(trim(coalesce(f.strain,''))),''),f.flock_name into v_farm_id,v_type,v_genetics,v_strain,v_flock_name from public.flocks f where f.id=p_flock_id;
 if v_farm_id is null then raise exception 'گله پیدا نشد';end if;
 if v_type<>'broiler' then raise exception 'این موتور فقط برای گله‌های گوشتی است';end if;
 if not exists(select 1 from public.farms fm where fm.id=v_farm_id and(fm.owner_id=v_user or exists(select 1 from public.farm_professional_access a where a.farm_id=fm.id and a.professional_user_id=v_user and a.status='active'))) then raise exception 'دسترسی به این گله مجاز نیست';end if;
 if p_age_days is null then select w.age_days into v_target_age from public.weekly_records w where w.flock_id=p_flock_id and w.age_days is not null order by w.age_days desc,w.created_at desc nulls last limit 1;else v_target_age:=greatest(0,p_age_days);end if;
 if v_target_age is null then return jsonb_build_object('ok',false,'reason','no_age','message','برای این گله رکورد سنی معتبر وجود ندارد.');end if;
 select fm.region into v_region from public.farms fm where fm.id=v_farm_id;
 with source as(select f.id flock_id,f.farm_id,f.flock_name,f.genetics,f.strain,f.placement_date,f.created_at flock_created_at,fm.region,w.id record_id,w.age_days,w.record_date,w.created_at record_created_at,w.average_weight_g,w.fcr weekly_fcr,w.cumulative_fcr,w.cv_percent,w.uniformity_10_percent,w.uniformity_15_percent,w.live_birds,w.mortality_count,f.initial_bird_count from public.flocks f join public.farms fm on fm.id=f.farm_id join public.weekly_records w on w.flock_id=f.id where lower(trim(coalesce(f.production_type,'')))='broiler' and abs(w.age_days-v_target_age)<=v_window),
 ranked as(select s.*,row_number()over(partition by s.flock_id order by abs(s.age_days-v_target_age),s.record_created_at desc nulls last,s.record_id desc)rn from source s),
 chosen as(select * from ranked where rn=1),enriched as(select c.*,(select w2.average_weight_g from public.weekly_records w2 where w2.flock_id=c.flock_id and w2.age_days<c.age_days and w2.average_weight_g is not null order by w2.age_days desc,w2.created_at desc limit 1)previous_weight,(select sum(coalesce(w2.mortality_count,0)) from public.weekly_records w2 where w2.flock_id=c.flock_id and w2.age_days<=c.age_days)cumulative_mortality_count from chosen c),
 metrics as(select e.*,case when e.average_weight_g is not null and e.previous_weight is not null then e.average_weight_g-e.previous_weight end weekly_gain,case when coalesce(e.live_birds,0)+coalesce(e.mortality_count,0)>0 then 100.0*e.mortality_count/(e.live_birds+e.mortality_count)end weekly_mortality,case when e.initial_bird_count>0 then 100.0*coalesce(e.cumulative_mortality_count,0)/e.initial_bird_count end cumulative_mortality,case when e.initial_bird_count>0 then 100.0-(100.0*coalesce(e.cumulative_mortality_count,0)/e.initial_bird_count)end livability from enriched e),
 base as(select * from metrics where flock_id<>p_flock_id),
 defs as(select * from(values('body_weight','وزن متوسط','context'),('weekly_gain','افزایش وزن هفتگی','higher'),('weekly_fcr','FCR هفتگی','lower'),('cumulative_fcr','FCR تجمعی','lower'),('cv','CV','lower'),('uniformity10','یکنواختی ±۱۰٪','higher'),('uniformity15','یکنواختی ±۱۵٪','higher'),('weekly_mortality','تلفات هفتگی','lower'),('cumulative_mortality','تلفات تجمعی','lower'),('livability','زنده‌مانی','higher'))d(key,label,direction)),
 cohorts as(select * from(values('all','کل گله‌های گوشتی','all'),('genetics','همان ژنتیک / شرکت','genetics'),('strain','همان سویه','strain'),('region','همان منطقه','region'),('recent30','۳۰ گله اخیر','recent30'),('recent50','۵۰ گله اخیر','recent50'))c(key,label,kind)),
 filtered as(select c.key,c.label,c.kind,b.* from cohorts c join base b on case c.kind when'all'then true when'genetics'then v_genetics is not null and nullif(lower(trim(coalesce(b.genetics,''))),'')=v_genetics when'strain'then v_strain is not null and nullif(lower(trim(coalesce(b.strain,''))),'')=v_strain when'region'then v_region is not null and b.region=v_region else true end),
 ranked_cohorts as(select f.*,row_number()over(partition by f.key order by coalesce(f.placement_date,f.record_date,f.flock_created_at)desc nulls last,f.flock_created_at desc)recent_rn from filtered f),
 limited as(select * from ranked_cohorts where kind not in('recent30','recent50') or(kind='recent30'and recent_rn<=30)or(kind='recent50'and recent_rn<=50)),
 metric_values as(select l.key,l.label,d.key metric_key,d.label metric_label,d.direction,case d.key when'body_weight'then l.average_weight_g when'weekly_gain'then l.weekly_gain when'weekly_fcr'then l.weekly_fcr when'cumulative_fcr'then l.cumulative_fcr when'cv'then l.cv_percent when'uniformity10'then l.uniformity_10_percent when'uniformity15'then l.uniformity_15_percent when'weekly_mortality'then l.weekly_mortality when'cumulative_mortality'then l.cumulative_mortality when'livability'then l.livability end value from limited l cross join defs d),
 current_values as(select d.key metric_key,d.label metric_label,d.direction,case d.key when'body_weight'then m.average_weight_g when'weekly_gain'then m.weekly_gain when'weekly_fcr'then m.weekly_fcr when'cumulative_fcr'then m.cumulative_fcr when'cv'then m.cv_percent when'uniformity10'then m.uniformity_10_percent when'uniformity15'then m.uniformity_15_percent when'weekly_mortality'then m.weekly_mortality when'cumulative_mortality'then m.cumulative_mortality when'livability'then m.livability end value from metrics m cross join defs d where m.flock_id=p_flock_id),
 stats as(select mv.key,max(mv.label)cohort_label,mv.metric_key,mv.metric_label,mv.direction,count(mv.value)::int n,percentile_cont(.10)within group(order by mv.value)p10,percentile_cont(.25)within group(order by mv.value)p25,percentile_cont(.50)within group(order by mv.value)median,percentile_cont(.75)within group(order by mv.value)p75,percentile_cont(.90)within group(order by mv.value)p90,min(mv.value)min_value,max(mv.value)max_value,cv.value current_value,case when cv.value is null or count(mv.value)=0 then null when mv.direction='higher'then 100.0*avg(case when mv.value<=cv.value then 1.0 else 0.0 end)when mv.direction='lower'then 100.0*avg(case when mv.value>=cv.value then 1.0 else 0.0 end)else 100.0*avg(case when mv.value<=cv.value then 1.0 else 0.0 end)end percentile from metric_values mv join current_values cv on cv.metric_key=mv.metric_key group by mv.key,mv.metric_key,mv.metric_label,mv.direction,cv.value),
 grouped as(select key,max(cohort_label)label,jsonb_object_agg(metric_key,jsonb_build_object('label',metric_label,'direction',direction,'n',n,'p10',round(p10::numeric,2),'p25',round(p25::numeric,2),'median',round(median::numeric,2),'p75',round(p75::numeric,2),'p90',round(p90::numeric,2),'min',round(min_value::numeric,2),'max',round(max_value::numeric,2),'current',round(current_value::numeric,2),'percentile',round(percentile::numeric,1)))metrics from stats group by key)
 select jsonb_agg(jsonb_build_object('key',g.key,'label',g.label,'metrics',g.metrics))into v_cohorts from grouped g;
 return jsonb_build_object('ok',true,'engine','broiler-benchmark-v1','flock',jsonb_build_object('id',p_flock_id,'name',v_flock_name,'age_days',v_target_age,'genetics',v_genetics,'strain',v_strain,'region',v_region),'settings',jsonb_build_object('age_window_days',v_window,'recent_limit',greatest(10,least(coalesce(p_recent_limit,30),50))),'cohorts',coalesce(v_cohorts,'[]'::jsonb));
end;$$;
revoke execute on function public.get_broiler_benchmark_v1(uuid,integer,integer,integer) from public,anon;
grant execute on function public.get_broiler_benchmark_v1(uuid,integer,integer,integer) to authenticated;
