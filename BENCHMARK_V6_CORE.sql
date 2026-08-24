-- =========================================================
-- ADINE POULTRY HEALTH CENTER
-- BENCHMARK V6 - SAFE PEER BENCHMARKING
-- =========================================================
-- اصول:
-- 1) استاندارد رسمی/مدیریتی مرجع اصلی است؛ Benchmark فقط مقایسه مکمل است.
-- 2) هر فارم فقط یک بار در جامعه مقایسه وزن می‌گیرد.
-- 3) نزدیک‌ترین رکورد معتبر به سن گله انتخاب می‌شود.
-- 4) خود فارم از جامعه همتا حذف می‌شود.
-- 5) حداقل 10 فارم مستقل برای نمایش Benchmark لازم است.
-- 6) امتیاز Peer فقط از 20 فارم مستقل به بالا قابل استفاده در امتیاز ترکیبی است.
-- 7) برای وزن، رتبه «بهتر/بدتر» صادر نمی‌شود؛ فقط جایگاه توزیعی نمایش داده می‌شود.
-- =========================================================

begin;

drop function if exists public.get_flock_benchmark_v6(uuid,text,integer);
drop function if exists public.get_flock_metric_history_v6(uuid,text,integer);

create or replace function public.get_flock_benchmark_v6(
    p_flock_id uuid,
    p_metric text,
    p_age_window_days integer default 7
)
returns table(
    metric text,
    direction text,
    cohort_level text,
    cohort_label text,
    comparable_farms bigint,
    comparable_flocks bigint,
    comparable_records bigint,
    age_min integer,
    age_max integer,
    p10 numeric,
    p25 numeric,
    median numeric,
    p75 numeric,
    p90 numeric,
    current_value numeric,
    peer_percentile numeric,
    peer_score numeric,
    peer_score_usable boolean,
    confidence_level text,
    confidence_label text,
    sample_adequate boolean,
    sample_note text,
    self_median numeric,
    self_previous numeric,
    self_change_pct numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_farm_id uuid;
    v_type text;
    v_genetics text;
    v_strain text;
    v_age integer;
    v_window integer := greatest(3, least(coalesce(p_age_window_days,7),14));
    v_level text;
    v_label text;
    v_farms bigint := 0;
    v_flocks bigint := 0;
    v_direction text;
    v_current numeric;
    v_self_median numeric;
    v_self_previous numeric;
    v_self_change numeric;
    v_percentile numeric;
    v_score numeric;
    v_conf text;
    v_conf_label text;
    v_adequate boolean := false;
    v_note text;
begin
    if p_metric is null or p_metric not in (
        'body_weight','fcr','mortality','uniformity','cv',
        'egg_production','egg_weight','fertility','hatchability'
    ) then
        raise exception 'شاخص بنچمارک معتبر نیست';
    end if;

    v_direction := case
        when p_metric in ('fcr','mortality','cv') then 'lower'
        when p_metric in ('uniformity','egg_production','fertility','hatchability') then 'higher'
        else 'context'
    end;

    select f.farm_id,
           lower(trim(coalesce(f.production_type,''))),
           lower(trim(coalesce(f.genetics,''))),
           lower(trim(coalesce(f.strain,'')))
      into v_farm_id, v_type, v_genetics, v_strain
    from public.flocks f
    where f.id = p_flock_id;

    if v_farm_id is null then
        raise exception 'گله پیدا نشد';
    end if;

    if not (
        exists(select 1 from public.farms fm where fm.id=v_farm_id and fm.owner_id=auth.uid())
        or exists(select 1 from public.farm_professional_access a
                  where a.farm_id=v_farm_id and a.professional_user_id=auth.uid() and a.status='active')
    ) then
        raise exception 'دسترسی به این گله مجاز نیست';
    end if;

    select w.age_days
      into v_age
    from public.weekly_records w
    where w.flock_id=p_flock_id
      and w.age_days is not null
    order by w.created_at desc nulls last
    limit 1;

    if v_age is null then
        return;
    end if;

    -- انتخاب دقیق‌ترین جامعه‌ای که حداقل 10 فارم مستقل داشته باشد.
    for v_level in select * from unnest(array['exact','genetics','production']) loop
        v_label := case v_level
            when 'exact' then 'همان نوع گله، ژنتیک و سویه'
            when 'genetics' then 'همان نوع گله و ژنتیک'
            else 'همان نوع گله'
        end;

        with candidate_rows as (
            select
                f.farm_id,
                f.id as flock_id,
                w.id as record_id,
                w.age_days,
                w.created_at,
                case p_metric
                    when 'body_weight' then w.average_weight_g::numeric
                    when 'fcr' then w.cumulative_fcr::numeric
                    when 'uniformity' then w.uniformity_10_percent::numeric
                    when 'cv' then w.cv_percent::numeric
                    when 'mortality' then
                        case when coalesce(w.live_birds,0)+coalesce(w.mortality_count,0)>0
                             then (w.mortality_count::numeric / (w.live_birds+w.mortality_count))*100
                             end
                    when 'egg_production' then nullif(w.production_metrics->>'hen_day_pct','')::numeric
                    when 'egg_weight' then nullif(w.production_metrics->>'egg_weight_g','')::numeric
                    when 'fertility' then nullif(w.production_metrics->>'fertility_pct','')::numeric
                    when 'hatchability' then nullif(w.production_metrics->>'hatchability_pct','')::numeric
                end as metric_value
            from public.flocks f
            join public.weekly_records w on w.flock_id=f.id
            where f.farm_id <> v_farm_id
              and f.farm_id is not null
              and f.id <> p_flock_id
              and lower(trim(coalesce(f.production_type,'')))=v_type
              and w.age_days is not null
              and abs(w.age_days-v_age)<=v_window
              and case v_level
                    when 'exact' then lower(trim(coalesce(f.genetics,'')))=v_genetics
                                      and lower(trim(coalesce(f.strain,'')))=v_strain
                    when 'genetics' then lower(trim(coalesce(f.genetics,'')))=v_genetics
                    else true
                  end
        ), ranked as (
            select *, row_number() over(
                partition by farm_id
                order by
                    case when metric_value is null then 1 else 0 end,
                    abs(age_days-v_age),
                    created_at desc nulls last,
                    record_id desc
            ) rn
            from candidate_rows
        )
        select count(distinct farm_id), count(distinct flock_id)
          into v_farms, v_flocks
        from ranked
        where rn=1 and metric_value is not null;

        if v_farms>=10 then
            exit;
        end if;
    end loop;

    if v_farms<10 then
        return query
        select p_metric, v_direction,
               coalesce(v_level,'none'),
               coalesce(v_label,'داده کافی برای بنچمارک وجود ندارد'),
               coalesce(v_farms,0), coalesce(v_flocks,0), coalesce(v_farms,0),
               null::integer,null::integer,
               null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,
               null::numeric,null::numeric,null::numeric,false,
               'insufficient','داده ناکافی',false,
               'برای نمایش مقایسه معتبر حداقل ۱۰ فارم مستقل با داده معتبر در بازه سنی مشابه لازم است.',
               null::numeric,null::numeric,null::numeric;
        return;
    end if;

    v_adequate := true;
    if v_farms>=50 then
        v_conf := 'stable'; v_conf_label := 'بنچمارک پایدار';
    elsif v_farms>=20 then
        v_conf := 'reliable'; v_conf_label := 'بنچمارک قابل اتکا';
    else
        v_conf := 'initial'; v_conf_label := 'بنچمارک اولیه';
    end if;

    v_note := case
        when v_farms<20 then 'جامعه هنوز کوچک است؛ برای امتیاز جایگاه از آن استفاده نشود و فقط به‌عنوان مقایسه اولیه نمایش داده شود.'
        when v_farms<50 then 'جامعه قابل اتکاست؛ هر فارم فقط یک رکورد نماینده دارد و سن رکوردها نزدیک به سن گله انتخاب شده است.'
        else 'جامعه پایدار است؛ هر فارم فقط یک رکورد نماینده دارد و سن رکوردها نزدیک به سن گله انتخاب شده است.'
    end;

    return query
    with candidate_rows as (
        select
            f.farm_id,
            f.id as flock_id,
            w.id as record_id,
            w.age_days,
            w.created_at,
            case p_metric
                when 'body_weight' then w.average_weight_g::numeric
                when 'fcr' then w.cumulative_fcr::numeric
                when 'uniformity' then w.uniformity_10_percent::numeric
                when 'cv' then w.cv_percent::numeric
                when 'mortality' then
                    case when coalesce(w.live_birds,0)+coalesce(w.mortality_count,0)>0
                         then (w.mortality_count::numeric / (w.live_birds+w.mortality_count))*100
                         end
                when 'egg_production' then nullif(w.production_metrics->>'hen_day_pct','')::numeric
                when 'egg_weight' then nullif(w.production_metrics->>'egg_weight_g','')::numeric
                when 'fertility' then nullif(w.production_metrics->>'fertility_pct','')::numeric
                when 'hatchability' then nullif(w.production_metrics->>'hatchability_pct','')::numeric
            end as metric_value
        from public.flocks f
        join public.weekly_records w on w.flock_id=f.id
        where f.farm_id <> v_farm_id
          and f.farm_id is not null
          and lower(trim(coalesce(f.production_type,'')))=v_type
          and w.age_days is not null
          and abs(w.age_days-v_age)<=v_window
          and case v_level
                when 'exact' then lower(trim(coalesce(f.genetics,'')))=v_genetics
                                  and lower(trim(coalesce(f.strain,'')))=v_strain
                when 'genetics' then lower(trim(coalesce(f.genetics,'')))=v_genetics
                else true
              end
    ), ranked as (
        select *, row_number() over(
            partition by farm_id
            order by
                case when metric_value is null then 1 else 0 end,
                abs(age_days-v_age),
                created_at desc nulls last,
                record_id desc
        ) rn
        from candidate_rows
    ), valid as (
        select * from ranked where rn=1 and metric_value is not null
    ), stats as (
        select count(distinct farm_id)::bigint cf,
               count(distinct flock_id)::bigint cl,
               count(*)::bigint cr,
               min(age_days)::integer amin,
               max(age_days)::integer amax,
               percentile_cont(.10) within group(order by metric_value)::numeric q10,
               percentile_cont(.25) within group(order by metric_value)::numeric q25,
               percentile_cont(.50) within group(order by metric_value)::numeric q50,
               percentile_cont(.75) within group(order by metric_value)::numeric q75,
               percentile_cont(.90) within group(order by metric_value)::numeric q90
        from valid
    ), current_candidates as (
        select
            case p_metric
                when 'body_weight' then w.average_weight_g::numeric
                when 'fcr' then w.cumulative_fcr::numeric
                when 'uniformity' then w.uniformity_10_percent::numeric
                when 'cv' then w.cv_percent::numeric
                when 'mortality' then
                    case when coalesce(w.live_birds,0)+coalesce(w.mortality_count,0)>0
                         then (w.mortality_count::numeric / (w.live_birds+w.mortality_count))*100
                         end
                when 'egg_production' then nullif(w.production_metrics->>'hen_day_pct','')::numeric
                when 'egg_weight' then nullif(w.production_metrics->>'egg_weight_g','')::numeric
                when 'fertility' then nullif(w.production_metrics->>'fertility_pct','')::numeric
                when 'hatchability' then nullif(w.production_metrics->>'hatchability_pct','')::numeric
            end value,
            abs(coalesce(w.age_days,v_age)-v_age) age_distance,
            w.created_at
        from public.weekly_records w
        where w.flock_id=p_flock_id
    ), current_row as (
        select value from current_candidates
        where value is not null
        order by age_distance, created_at desc nulls last
        limit 1
    ), self_rows as (
        select
            case p_metric
                when 'body_weight' then w.average_weight_g::numeric
                when 'fcr' then w.cumulative_fcr::numeric
                when 'uniformity' then w.uniformity_10_percent::numeric
                when 'cv' then w.cv_percent::numeric
                when 'mortality' then
                    case when coalesce(w.live_birds,0)+coalesce(w.mortality_count,0)>0
                         then (w.mortality_count::numeric / (w.live_birds+w.mortality_count))*100
                         end
                when 'egg_production' then nullif(w.production_metrics->>'hen_day_pct','')::numeric
                when 'egg_weight' then nullif(w.production_metrics->>'egg_weight_g','')::numeric
                when 'fertility' then nullif(w.production_metrics->>'fertility_pct','')::numeric
                when 'hatchability' then nullif(w.production_metrics->>'hatchability_pct','')::numeric
            end value,
            w.age_days,
            w.created_at,
            row_number() over(order by coalesce(w.age_days,0) desc, w.created_at desc nulls last) rn
        from public.weekly_records w
        where w.flock_id=p_flock_id
    ), self_stats as (
        select
            percentile_cont(.50) within group(order by value)::numeric self_med,
            max(value) filter(where rn=2)::numeric prev
        from self_rows where value is not null
    ), rank_stats as (
        select
            c.value,
            case
                when p_metric='body_weight' then null
                when v_direction='lower' then 100.0 * avg(case when v.metric_value >= c.value then 1.0 else 0.0 end)
                when v_direction='higher' then 100.0 * avg(case when v.metric_value <= c.value then 1.0 else 0.0 end)
            end pct
        from valid v cross join current_row c
        group by c.value
    )
    select
        p_metric,
        v_direction,
        v_level,
        v_label,
        s.cf,s.cl,s.cr,s.amin,s.amax,
        s.q10,s.q25,s.q50,s.q75,s.q90,
        c.value,
        r.pct,
        case when v_conf in ('reliable','stable') and p_metric<>'body_weight' then round(r.pct,1) else null end,
        case when v_conf in ('reliable','stable') and p_metric<>'body_weight' then true else false end,
        v_conf,
        v_conf_label,
        true,
        v_note,
        ss.self_med,
        ss.prev,
        case when ss.prev is null or ss.prev=0 or c.value is null then null
             else round(((c.value-ss.prev)/abs(ss.prev))*100,2) end
    from stats s
    cross join current_row c
    cross join self_stats ss
    cross join rank_stats r;
end;
$$;

revoke all on function public.get_flock_benchmark_v6(uuid,text,integer) from public;
grant execute on function public.get_flock_benchmark_v6(uuid,text,integer) to authenticated;

create or replace function public.get_flock_metric_history_v6(
    p_flock_id uuid,
    p_metric text,
    p_limit integer default 12
)
returns table(
    age_days integer,
    metric_value numeric,
    created_at timestamptz
)
language plpgsql
security definer
set search_path=public
as $$
declare
    v_farm_id uuid;
    v_ok boolean;
begin
    if p_metric is null or p_metric not in (
        'body_weight','fcr','mortality','uniformity','cv',
        'egg_production','egg_weight','fertility','hatchability'
    ) then
        raise exception 'شاخص نامعتبر است';
    end if;

    select farm_id into v_farm_id from public.flocks where id=p_flock_id;

    select exists(select 1 from public.farms f where f.id=v_farm_id and f.owner_id=auth.uid())
        or exists(select 1 from public.farm_professional_access a
                  where a.farm_id=v_farm_id and a.professional_user_id=auth.uid() and a.status='active')
      into v_ok;

    if not v_ok then raise exception 'دسترسی به این گله مجاز نیست'; end if;

    return query
    select w.age_days,
        case p_metric
            when 'body_weight' then w.average_weight_g::numeric
            when 'fcr' then w.cumulative_fcr::numeric
            when 'mortality' then case when coalesce(w.live_birds,0)+coalesce(w.mortality_count,0)>0
                then (w.mortality_count::numeric/(w.live_birds+w.mortality_count))*100 end
            when 'uniformity' then w.uniformity_10_percent::numeric
            when 'cv' then w.cv_percent::numeric
            when 'egg_production' then nullif(w.production_metrics->>'hen_day_pct','')::numeric
            when 'egg_weight' then nullif(w.production_metrics->>'egg_weight_g','')::numeric
            when 'fertility' then nullif(w.production_metrics->>'fertility_pct','')::numeric
            when 'hatchability' then nullif(w.production_metrics->>'hatchability_pct','')::numeric
        end,
        w.created_at
    from public.weekly_records w
    where w.flock_id=p_flock_id
    order by coalesce(w.age_days,0), w.created_at
    limit greatest(1,least(coalesce(p_limit,12),52));
end;
$$;

revoke all on function public.get_flock_metric_history_v6(uuid,text,integer) from public;
grant execute on function public.get_flock_metric_history_v6(uuid,text,integer) to authenticated;

create index if not exists idx_benchmark_flocks_cohort
on public.flocks(production_type,genetics,strain,farm_id);

create index if not exists idx_benchmark_weekly_flock_age_created
on public.weekly_records(flock_id,age_days,created_at desc);

commit;
