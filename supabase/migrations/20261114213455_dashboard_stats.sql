-- =============================================================================
-- Atelio — Migration 0007 : indicateurs du tableau de bord
-- =============================================================================
-- * public.get_dashboard_stats(workspace_id) : tous les indicateurs en un seul appel
--   (PostgREST n'expose pas les agrégats sum() par défaut) ;
-- * SECURITY INVOKER : la RLS des tables s'applique toujours, en plus du contrôle
--   d'appartenance explicite (erreur 42501 pour un espace étranger) ;
-- * dates relatives au jour de Paris (DT-012) ; « expiré » reste dérivé
--   (envoyé + validité dépassée) ;
-- * chiffre d'affaires suivi = devis acceptés, rattachés au mois de leur acceptation
--   (accepted_at, heure de Paris).
-- Aucune table ni index nouveau.
-- =============================================================================

create function public.get_dashboard_stats(p_workspace_id uuid)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_today       date := (now() at time zone 'Europe/Paris')::date;
  v_month_start date := date_trunc('month', v_today)::date;
  v_week_start  date := date_trunc('week', v_today)::date; -- lundi
  v_result      jsonb;
begin
  if p_workspace_id is null or not private.is_workspace_member(p_workspace_id) then
    raise exception 'Accès refusé à cet espace.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'today', v_today,

    'clients', (select count(*) from public.clients c where c.workspace_id = p_workspace_id),

    'projects_in_progress', (
      select count(*) from public.projects p
      where p.workspace_id = p_workspace_id and p.status = 'in_progress'
    ),

    'tasks_open', (
      select count(*) from public.tasks t
      where t.workspace_id = p_workspace_id and t.status <> 'done'
    ),

    'tasks_overdue', (
      select count(*) from public.tasks t
      where t.workspace_id = p_workspace_id and t.status <> 'done' and t.due_date < v_today
    ),

    'revenue', (
      select jsonb_build_object(
        'count', count(*),
        'subtotal_cents', coalesce(sum(q.subtotal_cents), 0)::bigint,
        'total_cents', coalesce(sum(q.total_cents), 0)::bigint
      )
      from public.quotes q
      where q.workspace_id = p_workspace_id and q.status = 'accepted'
    ),

    'pipeline', (
      select jsonb_build_object(
        'count', count(*),
        'subtotal_cents', coalesce(sum(q.subtotal_cents), 0)::bigint,
        'total_cents', coalesce(sum(q.total_cents), 0)::bigint
      )
      from public.quotes q
      where q.workspace_id = p_workspace_id and q.status = 'sent' and q.valid_until >= v_today
    ),

    -- 6 derniers mois (mois courant inclus), mois sans devis = 0
    'revenue_by_month', (
      select jsonb_agg(
               jsonb_build_object(
                 'month', to_char(m.month, 'YYYY-MM'),
                 'subtotal_cents', coalesce(r.subtotal_cents, 0),
                 'total_cents', coalesce(r.total_cents, 0)
               ) order by m.month
             )
      from generate_series(v_month_start - interval '5 months', v_month_start, interval '1 month') as m(month)
      left join (
        select date_trunc('month', q.accepted_at at time zone 'Europe/Paris') as month,
               sum(q.subtotal_cents)::bigint as subtotal_cents,
               sum(q.total_cents)::bigint as total_cents
        from public.quotes q
        where q.workspace_id = p_workspace_id
          and q.status = 'accepted'
          and q.accepted_at >= ((v_month_start - interval '5 months') at time zone 'Europe/Paris')
        group by 1
      ) r on r.month = m.month
    ),

    -- 8 dernières semaines (lundi → dimanche, semaine courante incluse)
    'tasks_completed_by_week', (
      select jsonb_agg(
               jsonb_build_object('week_start', to_char(w.week, 'YYYY-MM-DD'), 'count', coalesce(d.count, 0))
               order by w.week
             )
      from generate_series(v_week_start - interval '7 weeks', v_week_start, interval '1 week') as w(week)
      left join (
        select date_trunc('week', t.completed_at at time zone 'Europe/Paris') as week, count(*) as count
        from public.tasks t
        where t.workspace_id = p_workspace_id
          and t.status = 'done'
          and t.completed_at >= ((v_week_start - interval '7 weeks') at time zone 'Europe/Paris')
        group by 1
      ) d on d.week = w.week
    )
  ) into v_result;

  return v_result;
end;
$$;

comment on function public.get_dashboard_stats(uuid) is
  'Indicateurs du tableau de bord (jour de Paris). SECURITY INVOKER : RLS appliquée.';

revoke all on function public.get_dashboard_stats(uuid) from public, anon;
grant execute on function public.get_dashboard_stats(uuid) to authenticated;
