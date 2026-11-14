-- =============================================================================
-- Atelio — Migration 0002 : clients (CRM) et journal d'activité
-- =============================================================================
-- * clients : rattachés à un espace, gérés par tous ses membres (RLS) ;
-- * search_text : colonne générée, normalisée (minuscules, sans accents) et indexée
--   en trigrammes pour une recherche rapide et insensible aux accents ;
-- * activity_logs : journal alimenté UNIQUEMENT par des triggers (lecture seule
--   pour les utilisateurs), réutilisé par les modules suivants.
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- Normalisation pour la recherche (minuscules, sans accents, espaces réduits)
-- -----------------------------------------------------------------------------
create function private.normalize_search(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select btrim(regexp_replace(
    lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(value, ''))),
    '\s+', ' ', 'g'
  ));
$$;

revoke all on function private.normalize_search(text) from public;
grant execute on function private.normalize_search(text) to authenticated;

-- -----------------------------------------------------------------------------
-- Clients
-- -----------------------------------------------------------------------------
create type public.client_kind as enum ('company', 'individual');

create table public.clients (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  kind          public.client_kind not null default 'company',
  contact_name  text not null check (char_length(btrim(contact_name)) between 1 and 120),
  company_name  text check (char_length(company_name) <= 120),
  email         text check (
                  email is null
                  or (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
                ),
  phone         text check (char_length(phone) <= 40),
  address_line  text check (char_length(address_line) <= 200),
  postal_code   text check (char_length(postal_code) <= 20),
  city          text check (char_length(city) <= 100),
  country       text not null default 'France' check (char_length(btrim(country)) between 1 and 80),
  notes         text check (char_length(notes) <= 5000),
  search_text   text generated always as (
                  private.normalize_search(
                    contact_name || ' ' || coalesce(company_name, '') || ' ' ||
                    coalesce(email, '') || ' ' || coalesce(city, '')
                  )
                ) stored,
  created_by    uuid default auth.uid() references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Une entreprise doit avoir un nom d'entreprise
  constraint clients_company_requires_name
    check (kind <> 'company' or char_length(btrim(coalesce(company_name, ''))) > 0)
);
comment on table public.clients is 'Clients (CRM) d''un espace de travail.';

create index clients_workspace_created_idx on public.clients (workspace_id, created_at desc);
create index clients_workspace_contact_idx on public.clients (workspace_id, lower(contact_name));
create index clients_search_trgm_idx on public.clients using gin (search_text extensions.gin_trgm_ops);

create trigger set_updated_at before update on public.clients
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Journal d'activité
-- -----------------------------------------------------------------------------
create table public.activity_logs (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  actor_id      uuid references auth.users (id) on delete set null,
  entity_type   text not null check (entity_type in ('client')),
  entity_id     uuid not null,
  action        text not null check (action in ('created', 'updated', 'deleted')),
  summary       text not null check (char_length(summary) <= 200),
  changes       text[] not null default '{}',
  created_at    timestamptz not null default now()
);
comment on table public.activity_logs is 'Journal d''activité, écrit uniquement par triggers.';
comment on column public.activity_logs.summary is 'Libellé de l''entité au moment de l''action (conservé après suppression).';
comment on column public.activity_logs.changes is 'Champs modifiés (action = updated).';

create index activity_logs_workspace_created_idx on public.activity_logs (workspace_id, created_at desc);
create index activity_logs_entity_idx on public.activity_logs (entity_type, entity_id, created_at desc);

/*
 * Trigger générique : private.log_activity('<entity_type>', '<colonne du libellé>'[, '<colonne de repli>'])
 * - ignore les mises à jour sans changement réel ;
 * - ignore les suppressions en cascade d'un espace supprimé (sinon violation de clé étrangère).
 */
create function private.log_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  entity_type text := tg_argv[0];
  label_col   text := tg_argv[1];
  fallback    text := coalesce(tg_argv[2], tg_argv[1]);
  rec         jsonb;
  old_rec     jsonb;
  changed     text[] := '{}';
  act         text;
  ws          uuid;
begin
  if tg_op = 'DELETE' then
    rec := to_jsonb(old);
    act := 'deleted';
  else
    rec := to_jsonb(new);
    act := case when tg_op = 'INSERT' then 'created' else 'updated' end;
  end if;

  ws := (rec ->> 'workspace_id')::uuid;
  if not exists (select 1 from public.workspaces w where w.id = ws) then
    return null;
  end if;

  if tg_op = 'UPDATE' then
    old_rec := to_jsonb(old);
    select coalesce(array_agg(key order by key), '{}') into changed
    from jsonb_each(rec) as n(key, value)
    where key not in ('updated_at', 'search_text') and n.value is distinct from old_rec -> key;
    if cardinality(changed) = 0 then
      return null;
    end if;
  end if;

  insert into public.activity_logs (workspace_id, actor_id, entity_type, entity_id, action, summary, changes)
  values (
    ws,
    auth.uid(),
    entity_type,
    (rec ->> 'id')::uuid,
    act,
    left(coalesce(nullif(btrim(rec ->> label_col), ''), rec ->> fallback, '—'), 200),
    changed
  );
  return null;
end;
$$;

revoke all on function private.log_activity() from public;

create trigger log_activity
  after insert or update or delete on public.clients
  for each row execute function private.log_activity('client', 'company_name', 'contact_name');

-- -----------------------------------------------------------------------------
-- Droits : écritures limitées aux colonnes métier (created_by, workspace_id figés)
-- -----------------------------------------------------------------------------
revoke all on public.clients, public.activity_logs from anon, authenticated;

grant select, delete on public.clients to authenticated;
grant insert (
  workspace_id, kind, contact_name, company_name, email, phone,
  address_line, postal_code, city, country, notes
) on public.clients to authenticated;
grant update (
  kind, contact_name, company_name, email, phone,
  address_line, postal_code, city, country, notes
) on public.clients to authenticated;

grant select on public.activity_logs to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.clients enable row level security;
alter table public.activity_logs enable row level security;

create policy "clients_select_members" on public.clients
  for select to authenticated
  using (private.is_workspace_member(workspace_id));

create policy "clients_insert_members" on public.clients
  for insert to authenticated
  with check (private.is_workspace_member(workspace_id));

create policy "clients_update_members" on public.clients
  for update to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));

create policy "clients_delete_members" on public.clients
  for delete to authenticated
  using (private.is_workspace_member(workspace_id));

create policy "activity_logs_select_members" on public.activity_logs
  for select to authenticated
  using (private.is_workspace_member(workspace_id));
