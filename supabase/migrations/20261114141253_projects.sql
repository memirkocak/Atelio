-- =============================================================================
-- Atelio — Migration 0004 : projets
-- =============================================================================
-- * projects : rattachés à un espace, client facultatif DU MÊME ESPACE (clé étrangère
--   composite : la RLS seule ne vérifie pas l'espace de la ligne référencée) ;
-- * completed_at : renseigné automatiquement au passage au statut « terminé » ;
-- * journal d'activité : réutilise private.log_activity (entity_type = 'project').
-- =============================================================================

create type public.project_status as enum ('upcoming', 'in_progress', 'on_hold', 'completed', 'cancelled');

-- Cible de la clé étrangère composite (client_id, workspace_id)
alter table public.clients
  add constraint clients_id_workspace_key unique (id, workspace_id);

create table public.projects (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  client_id     uuid,
  name          text not null check (char_length(btrim(name)) between 1 and 120),
  description   text check (char_length(description) <= 5000),
  status        public.project_status not null default 'upcoming',
  budget_cents  bigint check (budget_cents >= 0 and budget_cents <= 100000000000),
  start_date    date,
  due_date      date,
  progress      smallint not null default 0 check (progress between 0 and 100),
  completed_at  timestamptz,
  search_text   text generated always as (private.normalize_search(name)) stored,
  created_by    uuid default auth.uid() references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint projects_dates_order check (due_date is null or start_date is null or due_date >= start_date),
  -- Le client doit appartenir au même espace ; s'il est supprimé, le projet est détaché.
  constraint projects_client_same_workspace
    foreign key (client_id, workspace_id) references public.clients (id, workspace_id)
    on delete set null (client_id)
);
comment on table public.projects is 'Projets d''un espace de travail.';
comment on column public.projects.budget_cents is 'Budget en centimes (jamais de flottant).';
comment on column public.projects.completed_at is 'Date de passage au statut terminé (statistiques), gérée par trigger.';

create index projects_workspace_status_idx on public.projects (workspace_id, status);
create index projects_workspace_client_idx on public.projects (workspace_id, client_id);
create index projects_workspace_due_idx on public.projects (workspace_id, due_date);
create index projects_workspace_created_idx on public.projects (workspace_id, created_at desc);
create index projects_search_trgm_idx on public.projects using gin (search_text extensions.gin_trgm_ops);

create trigger set_updated_at before update on public.projects
  for each row execute function private.set_updated_at();

-- completed_at suit le statut (non modifiable directement : pas de droit sur la colonne)
create function private.set_project_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'completed' then
    if tg_op = 'INSERT' or old.status is distinct from 'completed' then
      new.completed_at := now();
    end if;
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger set_completed_at before insert or update of status on public.projects
  for each row execute function private.set_project_completed_at();

-- -----------------------------------------------------------------------------
-- Journal d'activité
-- -----------------------------------------------------------------------------
alter table public.activity_logs drop constraint activity_logs_entity_type_check;
alter table public.activity_logs
  add constraint activity_logs_entity_type_check check (entity_type in ('client', 'project'));

create trigger log_activity
  after insert or update or delete on public.projects
  for each row execute function private.log_activity('project', 'name');

-- -----------------------------------------------------------------------------
-- Droits
-- -----------------------------------------------------------------------------
revoke all on public.projects from anon, authenticated;

grant select, delete on public.projects to authenticated;
grant insert (
  workspace_id, client_id, name, description, status, budget_cents, start_date, due_date, progress
) on public.projects to authenticated;
grant update (
  client_id, name, description, status, budget_cents, start_date, due_date, progress
) on public.projects to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.projects enable row level security;

create policy "projects_select_members" on public.projects
  for select to authenticated
  using (private.is_workspace_member(workspace_id));

create policy "projects_insert_members" on public.projects
  for insert to authenticated
  with check (private.is_workspace_member(workspace_id));

create policy "projects_update_members" on public.projects
  for update to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));

create policy "projects_delete_members" on public.projects
  for delete to authenticated
  using (private.is_workspace_member(workspace_id));
