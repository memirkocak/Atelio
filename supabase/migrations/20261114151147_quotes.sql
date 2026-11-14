-- =============================================================================
-- Atelio — Migration 0006 : devis (quotes, quote_items, numérotation)
-- =============================================================================
-- Principes (DT-030) :
--  * aucune écriture directe sur quotes / quote_items : tout passe par les fonctions
--    public.save_quote, public.set_quote_status et public.duplicate_quote, qui vérifient
--    l'appartenance à l'espace et RECALCULENT tous les montants (ceux du navigateur sont ignorés) ;
--  * montants en centimes ; arrondi au centime par ligne (demi vers le haut) ;
--  * numérotation DEV-AAAA-NNNN par espace et par année, sans doublon même en concurrence ;
--  * modification uniquement en brouillon ; instantanés client / émetteur figés à l'envoi ;
--  * un client ayant des devis ne peut pas être supprimé.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Informations de l'entreprise (émetteur des devis) sur l'espace de travail
-- -----------------------------------------------------------------------------
alter table public.workspaces
  add column company_name        text check (char_length(company_name) <= 120),
  add column address_line        text check (char_length(address_line) <= 200),
  add column postal_code         text check (char_length(postal_code) <= 20),
  add column city                text check (char_length(city) <= 100),
  add column country             text not null default 'France' check (char_length(btrim(country)) between 1 and 80),
  add column email               text check (
                                   email is null
                                   or (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
                                 ),
  add column phone               text check (char_length(phone) <= 40),
  add column siret               text check (siret is null or siret ~ '^\d{14}$'),
  add column vat_number          text check (char_length(vat_number) <= 20),
  add column vat_exempt          boolean not null default false,
  add column quote_validity_days integer not null default 30 check (quote_validity_days between 1 and 365),
  add column quote_terms         text check (char_length(quote_terms) <= 2000),
  add column quote_footer        text check (char_length(quote_footer) <= 1000);

comment on column public.workspaces.vat_exempt is 'Franchise en base de TVA (art. 293 B du CGI) : lignes à 0 % et mention sur les devis.';

grant update (
  company_name, address_line, postal_code, city, country, email, phone, siret, vat_number,
  vat_exempt, quote_validity_days, quote_terms, quote_footer
) on public.workspaces to authenticated;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create type public.quote_status as enum ('draft', 'sent', 'accepted', 'refused');

create table public.quote_counters (
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  year          integer not null check (year between 2000 and 2999),
  last_value    integer not null check (last_value >= 0),
  primary key (workspace_id, year)
);
comment on table public.quote_counters is 'Compteurs de numérotation des devis (accès uniquement via fonctions).';

create table public.quotes (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references public.workspaces (id) on delete cascade,
  number           text not null check (number ~ '^DEV-\d{4}-\d{4,}$'),
  client_id        uuid not null,
  project_id       uuid,
  title            text not null check (char_length(btrim(title)) between 1 and 200),
  status           public.quote_status not null default 'draft',
  issue_date       date not null default current_date,
  valid_until      date not null,
  terms            text check (char_length(terms) <= 5000),
  vat_exempt       boolean not null default false,
  subtotal_cents   bigint not null default 0 check (subtotal_cents >= 0),
  vat_cents        bigint not null default 0 check (vat_cents >= 0),
  total_cents      bigint not null default 0 check (total_cents >= 0),
  client_snapshot  jsonb,
  issuer_snapshot  jsonb,
  sent_at          timestamptz,
  accepted_at      timestamptz,
  refused_at       timestamptz,
  search_text      text generated always as (private.normalize_search(number || ' ' || title)) stored,
  created_by       uuid default auth.uid() references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint quotes_number_unique unique (workspace_id, number),
  constraint quotes_id_workspace_key unique (id, workspace_id),
  constraint quotes_dates_order check (valid_until >= issue_date),
  constraint quotes_total_consistent check (total_cents = subtotal_cents + vat_cents),
  -- Client du même espace ; un client ayant des devis ne peut pas être supprimé.
  constraint quotes_client_same_workspace
    foreign key (client_id, workspace_id) references public.clients (id, workspace_id) on delete restrict,
  -- Projet du même espace ; s'il est supprimé, le devis est détaché.
  constraint quotes_project_same_workspace
    foreign key (project_id, workspace_id) references public.projects (id, workspace_id)
    on delete set null (project_id)
);
comment on table public.quotes is 'Devis. Écriture uniquement via public.save_quote / set_quote_status / duplicate_quote.';

create table public.quote_items (
  id                   uuid primary key default gen_random_uuid(),
  quote_id             uuid not null,
  workspace_id         uuid not null,
  position             smallint not null check (position between 1 and 100),
  label                text not null check (char_length(btrim(label)) between 1 and 200),
  description          text check (char_length(description) <= 2000),
  quantity             numeric(12, 3) not null check (quantity > 0 and quantity <= 1000000),
  unit                 text check (char_length(unit) <= 20),
  unit_price_cents     bigint not null check (unit_price_cents between 0 and 100000000000),
  vat_rate_bp          integer not null check (vat_rate_bp between 0 and 10000),
  line_subtotal_cents  bigint not null,
  line_vat_cents       bigint not null,
  line_total_cents     bigint not null,
  constraint quote_items_position_unique unique (quote_id, position),
  constraint quote_items_total_consistent check (line_total_cents = line_subtotal_cents + line_vat_cents),
  constraint quote_items_quote_same_workspace
    foreign key (quote_id, workspace_id) references public.quotes (id, workspace_id) on delete cascade
);
comment on table public.quote_items is 'Lignes de devis (copies : aucune dépendance à un catalogue).';

create index quotes_workspace_status_idx on public.quotes (workspace_id, status);
create index quotes_workspace_client_idx on public.quotes (workspace_id, client_id);
create index quotes_workspace_issue_idx on public.quotes (workspace_id, issue_date desc);
create index quotes_search_trgm_idx on public.quotes using gin (search_text extensions.gin_trgm_ops);
create index quote_items_quote_idx on public.quote_items (quote_id, position);

create trigger set_updated_at before update on public.quotes
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Fonctions internes
-- -----------------------------------------------------------------------------

/** Montants d'une ligne : HT = arrondi(quantité × PU), TVA = arrondi(HT × taux). Arrondi demi vers le haut. */
create function private.quote_line_amounts(
  p_quantity numeric,
  p_unit_price_cents bigint,
  p_vat_rate_bp integer,
  out subtotal_cents bigint,
  out vat_cents bigint
)
language sql
immutable
set search_path = ''
as $$
  select
    round(p_quantity * p_unit_price_cents)::bigint,
    round(round(p_quantity * p_unit_price_cents) * p_vat_rate_bp / 10000.0)::bigint;
$$;

/** Accès à l'espace : membre, ou rôle d'administration (scripts de démo). */
create function private.assert_workspace_access(p_workspace_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return;
  end if;
  if p_workspace_id is null or not private.is_workspace_member(p_workspace_id) then
    raise exception 'Accès refusé à cet espace.' using errcode = '42501';
  end if;
end;
$$;

/** Prochain numéro DEV-AAAA-NNNN (verrou de ligne via ON CONFLICT : aucun doublon en concurrence). */
create function private.next_quote_number(p_workspace_id uuid, p_year integer)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_value integer;
begin
  insert into public.quote_counters (workspace_id, year, last_value)
  values (p_workspace_id, p_year, 1)
  on conflict (workspace_id, year)
    do update set last_value = public.quote_counters.last_value + 1
  returning last_value into v_value;

  return 'DEV-' || p_year || '-' || case when v_value < 10000 then lpad(v_value::text, 4, '0') else v_value::text end;
end;
$$;

revoke all on function private.quote_line_amounts(numeric, bigint, integer) from public;
revoke all on function private.assert_workspace_access(uuid) from public;
revoke all on function private.next_quote_number(uuid, integer) from public;

-- -----------------------------------------------------------------------------
-- API : enregistrer un brouillon (création ou modification)
-- -----------------------------------------------------------------------------
/*
 * p_quote : { client_id, project_id?, title, issue_date?, valid_until?, terms? }
 * p_items : [{ label, description?, quantity, unit?, unit_price_cents, vat_rate_bp }, …] (1 à 100)
 * Les montants sont TOUJOURS recalculés ici ; tout montant transmis est ignoré.
 * Erreurs : 42501 accès refusé, AT001 devis non modifiable, AT002 devis introuvable,
 *           AT004 lignes invalides ; contraintes : 23514, 23503, 22P02.
 */
create function public.save_quote(p_workspace_id uuid, p_quote_id uuid, p_quote jsonb, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quote_id   uuid := p_quote_id;
  v_status     public.quote_status;
  v_exempt     boolean;
  v_validity   integer;
  v_issue      date;
  v_valid      date;
  v_item       jsonb;
  v_position   integer := 0;
  v_rate       integer;
  v_line       record;
  v_subtotal   bigint := 0;
  v_vat        bigint := 0;
begin
  perform private.assert_workspace_access(p_workspace_id);

  select w.vat_exempt, w.quote_validity_days into v_exempt, v_validity
  from public.workspaces w where w.id = p_workspace_id;
  if not found then
    raise exception 'Espace introuvable.' using errcode = '42501';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) not between 1 and 100 then
    raise exception 'Un devis doit contenir entre 1 et 100 lignes.' using errcode = 'AT004';
  end if;

  v_issue := coalesce(nullif(p_quote ->> 'issue_date', '')::date, current_date);
  v_valid := coalesce(nullif(p_quote ->> 'valid_until', '')::date, v_issue + v_validity);

  -- Premier passage : totaux (les lignes sont insérées après le devis)
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_rate := case when v_exempt then 0 else (v_item ->> 'vat_rate_bp')::integer end;
    select * into v_line
    from private.quote_line_amounts((v_item ->> 'quantity')::numeric, (v_item ->> 'unit_price_cents')::bigint, v_rate);
    v_subtotal := v_subtotal + v_line.subtotal_cents;
    v_vat := v_vat + v_line.vat_cents;
  end loop;

  if v_quote_id is null then
    insert into public.quotes (
      workspace_id, number, client_id, project_id, title, issue_date, valid_until, terms,
      vat_exempt, subtotal_cents, vat_cents, total_cents
    ) values (
      p_workspace_id,
      private.next_quote_number(p_workspace_id, extract(year from v_issue)::integer),
      (p_quote ->> 'client_id')::uuid,
      nullif(p_quote ->> 'project_id', '')::uuid,
      btrim(p_quote ->> 'title'),
      v_issue, v_valid,
      nullif(btrim(coalesce(p_quote ->> 'terms', '')), ''),
      v_exempt, v_subtotal, v_vat, v_subtotal + v_vat
    )
    returning id into v_quote_id;
  else
    select q.status into v_status
    from public.quotes q
    where q.id = v_quote_id and q.workspace_id = p_workspace_id
    for update;
    if not found then
      raise exception 'Devis introuvable.' using errcode = 'AT002';
    end if;
    if v_status <> 'draft' then
      raise exception 'Seul un devis en brouillon peut être modifié.' using errcode = 'AT001';
    end if;

    update public.quotes set
      client_id      = (p_quote ->> 'client_id')::uuid,
      project_id     = nullif(p_quote ->> 'project_id', '')::uuid,
      title          = btrim(p_quote ->> 'title'),
      issue_date     = v_issue,
      valid_until    = v_valid,
      terms          = nullif(btrim(coalesce(p_quote ->> 'terms', '')), ''),
      vat_exempt     = v_exempt,
      subtotal_cents = v_subtotal,
      vat_cents      = v_vat,
      total_cents    = v_subtotal + v_vat
    where id = v_quote_id;

    delete from public.quote_items where quote_id = v_quote_id;
  end if;

  -- Second passage : lignes
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_position := v_position + 1;
    v_rate := case when v_exempt then 0 else (v_item ->> 'vat_rate_bp')::integer end;
    select * into v_line
    from private.quote_line_amounts((v_item ->> 'quantity')::numeric, (v_item ->> 'unit_price_cents')::bigint, v_rate);

    insert into public.quote_items (
      quote_id, workspace_id, position, label, description, quantity, unit,
      unit_price_cents, vat_rate_bp, line_subtotal_cents, line_vat_cents, line_total_cents
    ) values (
      v_quote_id, p_workspace_id, v_position,
      btrim(v_item ->> 'label'),
      nullif(btrim(coalesce(v_item ->> 'description', '')), ''),
      (v_item ->> 'quantity')::numeric,
      nullif(btrim(coalesce(v_item ->> 'unit', '')), ''),
      (v_item ->> 'unit_price_cents')::bigint,
      v_rate,
      v_line.subtotal_cents, v_line.vat_cents, v_line.subtotal_cents + v_line.vat_cents
    );
  end loop;

  return v_quote_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- API : changer de statut (brouillon → envoyé → accepté / refusé)
-- -----------------------------------------------------------------------------
create function public.set_quote_status(p_workspace_id uuid, p_quote_id uuid, p_status public.quote_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quote record;
begin
  perform private.assert_workspace_access(p_workspace_id);

  select q.* into v_quote
  from public.quotes q
  where q.id = p_quote_id and q.workspace_id = p_workspace_id
  for update;
  if not found then
    raise exception 'Devis introuvable.' using errcode = 'AT002';
  end if;

  if v_quote.status = 'draft' and p_status = 'sent' then
    -- Instantanés : le devis envoyé ne dépend plus des fiches client / entreprise.
    update public.quotes q set
      status = 'sent',
      sent_at = now(),
      client_snapshot = (
        select jsonb_build_object(
          'kind', c.kind, 'contact_name', c.contact_name, 'company_name', c.company_name,
          'email', c.email, 'phone', c.phone, 'address_line', c.address_line,
          'postal_code', c.postal_code, 'city', c.city, 'country', c.country
        )
        from public.clients c where c.id = v_quote.client_id
      ),
      issuer_snapshot = (
        select jsonb_build_object(
          'name', w.name, 'company_name', w.company_name, 'address_line', w.address_line,
          'postal_code', w.postal_code, 'city', w.city, 'country', w.country, 'email', w.email,
          'phone', w.phone, 'siret', w.siret, 'vat_number', w.vat_number,
          'vat_exempt', w.vat_exempt, 'quote_footer', w.quote_footer
        )
        from public.workspaces w where w.id = p_workspace_id
      )
    where q.id = p_quote_id;
  elsif v_quote.status = 'sent' and p_status = 'accepted' then
    update public.quotes set status = 'accepted', accepted_at = now() where id = p_quote_id;
  elsif v_quote.status = 'sent' and p_status = 'refused' then
    update public.quotes set status = 'refused', refused_at = now() where id = p_quote_id;
  else
    raise exception 'Changement de statut impossible (% → %).', v_quote.status, p_status using errcode = 'AT003';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- API : dupliquer un devis en nouveau brouillon (nouveau numéro, dates du jour)
-- -----------------------------------------------------------------------------
create function public.duplicate_quote(p_workspace_id uuid, p_quote_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_source record;
  v_items  jsonb;
begin
  perform private.assert_workspace_access(p_workspace_id);

  select q.* into v_source
  from public.quotes q
  where q.id = p_quote_id and q.workspace_id = p_workspace_id;
  if not found then
    raise exception 'Devis introuvable.' using errcode = 'AT002';
  end if;

  select jsonb_agg(
           jsonb_build_object(
             'label', i.label, 'description', i.description, 'quantity', i.quantity, 'unit', i.unit,
             'unit_price_cents', i.unit_price_cents, 'vat_rate_bp', i.vat_rate_bp
           ) order by i.position
         )
  into v_items
  from public.quote_items i where i.quote_id = p_quote_id;

  return public.save_quote(
    p_workspace_id,
    null,
    jsonb_build_object(
      'client_id', v_source.client_id, 'project_id', v_source.project_id,
      'title', v_source.title, 'terms', v_source.terms
    ),
    v_items
  );
end;
$$;

revoke all on function public.save_quote(uuid, uuid, jsonb, jsonb) from public, anon;
revoke all on function public.set_quote_status(uuid, uuid, public.quote_status) from public, anon;
revoke all on function public.duplicate_quote(uuid, uuid) from public, anon;
grant execute on function public.save_quote(uuid, uuid, jsonb, jsonb) to authenticated, service_role;
grant execute on function public.set_quote_status(uuid, uuid, public.quote_status) to authenticated, service_role;
grant execute on function public.duplicate_quote(uuid, uuid) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Journal d'activité
-- -----------------------------------------------------------------------------
alter table public.activity_logs drop constraint activity_logs_entity_type_check;
alter table public.activity_logs
  add constraint activity_logs_entity_type_check check (entity_type in ('client', 'project', 'task', 'quote'));

create trigger log_activity
  after insert or update or delete on public.quotes
  for each row execute function private.log_activity('quote', 'number');

-- -----------------------------------------------------------------------------
-- Droits : lecture seule ; suppression des brouillons uniquement
-- -----------------------------------------------------------------------------
revoke all on public.quotes, public.quote_items, public.quote_counters from anon, authenticated;

grant select, delete on public.quotes to authenticated;
grant select on public.quote_items to authenticated;

alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.quote_counters enable row level security; -- aucune politique : inaccessible par l'API

create policy "quotes_select_members" on public.quotes
  for select to authenticated
  using (private.is_workspace_member(workspace_id));

create policy "quotes_delete_drafts" on public.quotes
  for delete to authenticated
  using (private.is_workspace_member(workspace_id) and status = 'draft');

create policy "quote_items_select_members" on public.quote_items
  for select to authenticated
  using (private.is_workspace_member(workspace_id));
