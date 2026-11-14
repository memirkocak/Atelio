-- =============================================================================
-- Atelio — Migration 0009 : statistiques
-- =============================================================================
-- * public.get_statistics(workspace_id, du, au) : indicateurs d'une période (jours de Paris,
--   bornes incluses), séries pour les graphiques, état actuel et meilleurs clients ;
-- * SECURITY INVOKER : la RLS des tables s'applique, en plus du contrôle d'appartenance
--   (42501) ; période invalide ou de plus de 3 ans : 22023 ;
-- * dates de référence : émission (devis créés), acceptation / refus (décisions),
--   fin de validité (devis expirés sans réponse), completed_at (projets, tâches) ;
-- * granularité des séries : semaine (lundi) jusqu'à 92 jours, mois au-delà.
-- Aucune table ni index nouveau.
-- =============================================================================

create function public.get_statistics(p_workspace_id uuid, p_from date, p_to date)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_today   date := (now() at time zone 'Europe/Paris')::date;
  v_from_ts timestamptz;
  v_to_ts   timestamptz;
  v_unit    text;
  v_step    interval;
  v_result  jsonb;
begin
  if p_workspace_id is null or not private.is_workspace_member(p_workspace_id) then
    raise exception 'Accès refusé à cet espace.' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 1100 then
    raise exception 'Période invalide.' using errcode = '22023';
  end if;

  -- Bornes en heure de Paris : [du 00:00, lendemain de « au » 00:00)
  v_from_ts := p_from::timestamp at time zone 'Europe/Paris';
  v_to_ts   := (p_to + 1)::timestamp at time zone 'Europe/Paris';
  v_unit    := case when p_to - p_from <= 92 then 'week' else 'month' end;
  v_step    := case when v_unit = 'week' then interval '1 week' else interval '1 month' end;

  with
  accepted as (
    select q.client_id, q.subtotal_cents, q.total_cents,
           date_trunc(v_unit, q.accepted_at at time zone 'Europe/Paris') as bucket
    from public.quotes q
    where q.workspace_id = p_workspace_id and q.status = 'accepted'
      and q.accepted_at >= v_from_ts and q.accepted_at < v_to_ts
  ),
  created as (
    select date_trunc(v_unit, q.issue_date::timestamp) as bucket
    from public.quotes q
    where q.workspace_id = p_workspace_id and q.issue_date between p_from and p_to
  ),
  done_tasks as (
    select date_trunc(v_unit, t.completed_at at time zone 'Europe/Paris') as bucket
    from public.tasks t
    where t.workspace_id = p_workspace_id and t.status = 'done'
      and t.completed_at >= v_from_ts and t.completed_at < v_to_ts
  ),
  done_projects as (
    select date_trunc(v_unit, p.completed_at at time zone 'Europe/Paris') as bucket
    from public.projects p
    where p.workspace_id = p_workspace_id and p.status = 'completed'
      and p.completed_at >= v_from_ts and p.completed_at < v_to_ts
  ),
  buckets as (
    select b::timestamp as bucket
    from generate_series(date_trunc(v_unit, p_from::timestamp), date_trunc(v_unit, p_to::timestamp), v_step) as b
  )
  select jsonb_build_object(
    'from', p_from,
    'to', p_to,
    'granularity', v_unit,

    'quotes_created', (select count(*) from created),
    'accepted', (
      select jsonb_build_object(
        'count', count(*),
        'subtotal_cents', coalesce(sum(subtotal_cents), 0)::bigint,
        'total_cents', coalesce(sum(total_cents), 0)::bigint
      ) from accepted
    ),
    'refused', (
      select count(*) from public.quotes q
      where q.workspace_id = p_workspace_id and q.status = 'refused'
        and q.refused_at >= v_from_ts and q.refused_at < v_to_ts
    ),
    -- Envoyés restés sans réponse dont la validité a expiré pendant la période
    'expired', (
      select count(*) from public.quotes q
      where q.workspace_id = p_workspace_id and q.status = 'sent'
        and q.valid_until between p_from and p_to and q.valid_until < v_today
    ),
    'projects_completed', (select count(*) from done_projects),
    'tasks_completed', (select count(*) from done_tasks),
    'activity_count', (
      select count(*) from public.activity_logs l
      where l.workspace_id = p_workspace_id and l.created_at >= v_from_ts and l.created_at < v_to_ts
    ),

    'series', (
      select jsonb_agg(
               jsonb_build_object(
                 'start', to_char(b.bucket, 'YYYY-MM-DD'),
                 'quotes_created', (select count(*) from created c where c.bucket = b.bucket),
                 'quotes_accepted', (select count(*) from accepted a where a.bucket = b.bucket),
                 'accepted_subtotal_cents',
                   (select coalesce(sum(a.subtotal_cents), 0)::bigint from accepted a where a.bucket = b.bucket),
                 'tasks_completed', (select count(*) from done_tasks d where d.bucket = b.bucket),
                 'projects_completed', (select count(*) from done_projects d where d.bucket = b.bucket)
               ) order by b.bucket
             )
      from buckets b
    ),

    -- État actuel (indépendant de la période)
    'tasks_by_status', (
      select coalesce(jsonb_object_agg(s.status, s.count), '{}'::jsonb)
      from (select t.status, count(*) as count from public.tasks t
            where t.workspace_id = p_workspace_id group by t.status) s
    ),
    'open_tasks_by_priority', (
      select coalesce(jsonb_object_agg(s.priority, s.count), '{}'::jsonb)
      from (select t.priority, count(*) as count from public.tasks t
            where t.workspace_id = p_workspace_id and t.status <> 'done' group by t.priority) s
    ),
    'projects_by_status', (
      select coalesce(jsonb_object_agg(s.status, s.count), '{}'::jsonb)
      from (select p.status, count(*) as count from public.projects p
            where p.workspace_id = p_workspace_id group by p.status) s
    ),

    'top_clients', (
      select coalesce(jsonb_agg(t order by t.subtotal_cents desc, t.name), '[]'::jsonb)
      from (
        select c.id, coalesce(nullif(c.company_name, ''), c.contact_name) as name,
               count(*) as quotes, sum(a.subtotal_cents)::bigint as subtotal_cents
        from accepted a
        join public.clients c on c.id = a.client_id and c.workspace_id = p_workspace_id
        group by c.id, c.company_name, c.contact_name
        order by sum(a.subtotal_cents) desc, 2
        limit 5
      ) t
    )
  ) into v_result;

  return v_result;
end;
$$;

comment on function public.get_statistics(uuid, date, date) is
  'Statistiques d''une période (jours de Paris, bornes incluses). SECURITY INVOKER : RLS appliquée.';

revoke all on function public.get_statistics(uuid, date, date) from public, anon;
grant execute on function public.get_statistics(uuid, date, date) to authenticated;
