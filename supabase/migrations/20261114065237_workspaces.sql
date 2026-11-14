-- =============================================================================
-- Atelio — Migration 0001 : profils, espaces de travail, membres, RLS
-- =============================================================================
-- Principes (docs/architecture.md, DT-022) :
--  * toute donnée métier appartient à un espace de travail (workspace) ;
--  * l'accès est contrôlé par la RLS via des fonctions SECURITY DEFINER placées
--    dans le schéma `private`, non exposé par l'API ;
--  * les créations de profil / espace se font uniquement par trigger à l'inscription ;
--  * les écritures autorisées sont limitées colonne par colonne (GRANT UPDATE (...)).
-- =============================================================================

create extension if not exists unaccent with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, supabase_auth_admin;

-- -----------------------------------------------------------------------------
-- Types
-- -----------------------------------------------------------------------------
create type public.workspace_role as enum ('owner', 'admin', 'member');

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (char_length(full_name) <= 80),
  avatar_url  text check (char_length(avatar_url) <= 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.profiles is 'Profil public d''un utilisateur (1–1 avec auth.users).';

create table public.workspaces (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null check (char_length(btrim(name)) between 1 and 80),
  slug                 text not null unique
                         check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  default_vat_rate_bp  integer not null default 2000 check (default_vat_rate_bp between 0 and 10000),
  timezone             text not null default 'Europe/Paris',
  currency             text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  is_demo              boolean not null default false,
  created_by           uuid references auth.users (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
comment on table public.workspaces is 'Espace de travail : unité d''isolation des données métier.';
comment on column public.workspaces.default_vat_rate_bp is 'Taux de TVA par défaut en points de base (2000 = 20 %).';

create table public.workspace_members (
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  role          public.workspace_role not null default 'member',
  created_at    timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
comment on table public.workspace_members is 'Appartenance d''un utilisateur à un espace, avec son rôle.';

create index workspace_members_user_id_idx on public.workspace_members (user_id);
create index workspaces_created_by_idx on public.workspaces (created_by);

-- -----------------------------------------------------------------------------
-- updated_at automatique
-- -----------------------------------------------------------------------------
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.workspaces
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Fonctions d'autorisation (utilisées par les politiques RLS)
-- SECURITY DEFINER : lisent workspace_members sans repasser par sa RLS (évite la récursion).
-- -----------------------------------------------------------------------------
create function private.is_workspace_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = (select auth.uid())
  );
$$;

create function private.has_workspace_role(ws uuid, roles public.workspace_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = (select auth.uid()) and m.role = any (roles)
  );
$$;

create function private.shares_workspace_with(other_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members mine
    join public.workspace_members theirs on theirs.workspace_id = mine.workspace_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = other_user
  );
$$;

revoke all on function private.is_workspace_member(uuid) from public;
revoke all on function private.has_workspace_role(uuid, public.workspace_role[]) from public;
revoke all on function private.shares_workspace_with(uuid) from public;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.has_workspace_role(uuid, public.workspace_role[]) to authenticated;
grant execute on function private.shares_workspace_with(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Création automatique : profil + espace personnel + rôle propriétaire
-- -----------------------------------------------------------------------------
create function private.slugify(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select left(
    btrim(
      regexp_replace(
        lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(value, ''))),
        '[^a-z0-9]+', '-', 'g'
      ),
      '-'
    ),
    40
  );
$$;

create function private.provision_user(user_id uuid, full_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_name     text := nullif(btrim(left(coalesce(full_name, ''), 80)), '');
  first_name     text := split_part(coalesce(clean_name, ''), ' ', 1);
  workspace_name text := case when first_name <> '' then 'Espace de ' || first_name else 'Mon espace' end;
  base_slug      text := coalesce(nullif(private.slugify(workspace_name), ''), 'espace');
  candidate      text;
  new_workspace  uuid;
begin
  insert into public.profiles (id, full_name)
  values (user_id, clean_name)
  on conflict (id) do nothing;

  -- Slug unique : base lisible + suffixe aléatoire (ex. espace-de-camille-4f2a)
  loop
    candidate := base_slug || '-' || substr(md5(gen_random_uuid()::text), 1, 4);
    exit when not exists (select 1 from public.workspaces w where w.slug = candidate);
  end loop;

  insert into public.workspaces (name, slug, created_by)
  values (workspace_name, candidate, user_id)
  returning id into new_workspace;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace, user_id, 'owner');
end;
$$;

revoke all on function private.slugify(text) from public;
revoke all on function private.provision_user(uuid, text) from public;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.provision_user(new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Rattrapage : comptes créés avant cette migration
do $$
declare
  u record;
begin
  for u in
    select au.id, au.raw_user_meta_data ->> 'full_name' as full_name
    from auth.users au
    where not exists (select 1 from public.profiles p where p.id = au.id)
  loop
    perform private.provision_user(u.id, u.full_name);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Droits (Data API) : aucun accès anonyme, écritures limitées par colonne
-- -----------------------------------------------------------------------------
revoke all on public.profiles, public.workspaces, public.workspace_members from anon, authenticated;

grant select on public.profiles, public.workspaces, public.workspace_members to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;
grant update (name, default_vat_rate_bp) on public.workspaces to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

-- profiles : soi-même et les membres de ses espaces ; modification de son propre profil
create policy "profiles_select_self_or_coworkers" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.shares_workspace_with(id));

create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- workspaces : lecture par les membres ; modification par owner / admin
create policy "workspaces_select_members" on public.workspaces
  for select to authenticated
  using (private.is_workspace_member(id));

create policy "workspaces_update_owner_admin" on public.workspaces
  for update to authenticated
  using (private.has_workspace_role(id, array['owner', 'admin']::public.workspace_role[]))
  with check (private.has_workspace_role(id, array['owner', 'admin']::public.workspace_role[]));

-- workspace_members : lecture par les membres de l'espace (écritures en V2 : invitations)
create policy "workspace_members_select_members" on public.workspace_members
  for select to authenticated
  using (private.is_workspace_member(workspace_id));
