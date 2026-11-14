-- =============================================================================
-- Atelio — Migration 0008 : rendez-vous (calendrier)
-- =============================================================================
-- * events : rattachés à un espace ; client et projet facultatifs DU MÊME ESPACE
--   (clés étrangères composites) ; supprimer le client / projet détache le rendez-vous ;
-- * starts_at / ends_at en timestamptz, fin STRICTEMENT après le début (fin exclusive) ;
--   « journée entière » : de 00:00 (heure de Paris) du premier jour à 00:00 du lendemain
--   du dernier jour — la conversion est faite côté application (src/lib/dates.ts) ;
-- * journal d'activité : entity_type = 'event'.
-- Les échéances des tâches, projets et devis ne sont PAS copiées : le calendrier les lit
-- dans leurs tables.
-- =============================================================================

create table public.events (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  client_id     uuid,
  project_id    uuid,
  title         text not null check (char_length(btrim(title)) between 1 and 200),
  description   text check (char_length(description) <= 5000),
  location      text check (char_length(location) <= 200),
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  all_day       boolean not null default false,
  created_by    uuid default auth.uid() references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint events_dates_order check (ends_at > starts_at),
  -- Garde-fou : un rendez-vous ne dure pas plus d'un an
  constraint events_max_duration check (ends_at - starts_at <= interval '366 days'),
  constraint events_client_same_workspace
    foreign key (client_id, workspace_id) references public.clients (id, workspace_id)
    on delete set null (client_id),
  constraint events_project_same_workspace
    foreign key (project_id, workspace_id) references public.projects (id, workspace_id)
    on delete set null (project_id)
);
comment on table public.events is 'Rendez-vous du calendrier d''un espace de travail.';
comment on column public.events.ends_at is 'Fin exclusive (journée entière : 00:00 Paris du lendemain du dernier jour).';

create index events_workspace_starts_idx on public.events (workspace_id, starts_at);
create index events_workspace_client_idx on public.events (workspace_id, client_id);
create index events_workspace_project_idx on public.events (workspace_id, project_id);

create trigger set_updated_at before update on public.events
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Journal d'activité
-- -----------------------------------------------------------------------------
alter table public.activity_logs drop constraint activity_logs_entity_type_check;
alter table public.activity_logs
  add constraint activity_logs_entity_type_check
  check (entity_type in ('client', 'project', 'task', 'quote', 'event'));

create trigger log_activity
  after insert or update or delete on public.events
  for each row execute function private.log_activity('event', 'title');

-- -----------------------------------------------------------------------------
-- Droits
-- -----------------------------------------------------------------------------
revoke all on public.events from anon, authenticated;

grant select, delete on public.events to authenticated;
grant insert (workspace_id, client_id, project_id, title, description, location, starts_at, ends_at, all_day)
  on public.events to authenticated;
grant update (client_id, project_id, title, description, location, starts_at, ends_at, all_day)
  on public.events to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.events enable row level security;

create policy "events_select_members" on public.events
  for select to authenticated
  using (private.is_workspace_member(workspace_id));

create policy "events_insert_members" on public.events
  for insert to authenticated
  with check (private.is_workspace_member(workspace_id));

create policy "events_update_members" on public.events
  for update to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));

create policy "events_delete_members" on public.events
  for delete to authenticated
  using (private.is_workspace_member(workspace_id));
