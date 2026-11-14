-- =============================================================================
-- Atelio — Migration 0005 : tâches
-- =============================================================================
-- * tasks : rattachées à un espace, projet facultatif DU MÊME ESPACE (clé étrangère
--   composite, comme projects → clients) ; supprimer le projet détache ses tâches ;
-- * completed_at : renseigné automatiquement au passage au statut « terminée » ;
-- * journal d'activité : entity_type = 'task'.
-- =============================================================================

create type public.task_status as enum ('todo', 'in_progress', 'done');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');

-- Cible de la clé étrangère composite (project_id, workspace_id)
alter table public.projects
  add constraint projects_id_workspace_key unique (id, workspace_id);

create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  project_id    uuid,
  title         text not null check (char_length(btrim(title)) between 1 and 200),
  description   text check (char_length(description) <= 5000),
  status        public.task_status not null default 'todo',
  priority      public.task_priority not null default 'medium',
  due_date      date,
  completed_at  timestamptz,
  search_text   text generated always as (private.normalize_search(title)) stored,
  created_by    uuid default auth.uid() references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Le projet doit appartenir au même espace ; s'il est supprimé, la tâche est détachée.
  constraint tasks_project_same_workspace
    foreign key (project_id, workspace_id) references public.projects (id, workspace_id)
    on delete set null (project_id)
);
comment on table public.tasks is 'Tâches d''un espace de travail.';
comment on column public.tasks.completed_at is 'Date de passage au statut terminée (statistiques), gérée par trigger.';

create index tasks_workspace_status_due_idx on public.tasks (workspace_id, status, due_date);
create index tasks_workspace_project_idx on public.tasks (workspace_id, project_id);
create index tasks_workspace_completed_idx on public.tasks (workspace_id, completed_at);
create index tasks_search_trgm_idx on public.tasks using gin (search_text extensions.gin_trgm_ops);

create trigger set_updated_at before update on public.tasks
  for each row execute function private.set_updated_at();

create function private.set_task_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'done' then
    if tg_op = 'INSERT' or old.status is distinct from 'done' then
      new.completed_at := now();
    end if;
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger set_completed_at before insert or update of status on public.tasks
  for each row execute function private.set_task_completed_at();

-- -----------------------------------------------------------------------------
-- Journal d'activité
-- -----------------------------------------------------------------------------
alter table public.activity_logs drop constraint activity_logs_entity_type_check;
alter table public.activity_logs
  add constraint activity_logs_entity_type_check check (entity_type in ('client', 'project', 'task'));

create trigger log_activity
  after insert or update or delete on public.tasks
  for each row execute function private.log_activity('task', 'title');

-- -----------------------------------------------------------------------------
-- Droits
-- -----------------------------------------------------------------------------
revoke all on public.tasks from anon, authenticated;

grant select, delete on public.tasks to authenticated;
grant insert (workspace_id, project_id, title, description, status, priority, due_date)
  on public.tasks to authenticated;
grant update (project_id, title, description, status, priority, due_date)
  on public.tasks to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.tasks enable row level security;

create policy "tasks_select_members" on public.tasks
  for select to authenticated
  using (private.is_workspace_member(workspace_id));

create policy "tasks_insert_members" on public.tasks
  for insert to authenticated
  with check (private.is_workspace_member(workspace_id));

create policy "tasks_update_members" on public.tasks
  for update to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));

create policy "tasks_delete_members" on public.tasks
  for delete to authenticated
  using (private.is_workspace_member(workspace_id));
