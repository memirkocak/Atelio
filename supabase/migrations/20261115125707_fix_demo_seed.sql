-- =============================================================================
-- Atelio — Migration 0012 : correctif du remplissage de la démo
-- =============================================================================
-- La migration 0011 (déjà appliquée sur le projet de dev) insérait un « null » non typé
-- dans activity_logs.actor_id (uuid) : la création d'une session anonyme échouait
-- (42804, détecté par « supabase db lint »). Corps identique, avec « null::uuid ».
-- =============================================================================

/** Remplit un espace de données de démonstration réalistes, relatives à aujourd'hui (Paris). */
create or replace function private.seed_demo_workspace(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  d       date := (now() at time zone 'Europe/Paris')::date;
  v_slug  text;
  c_opale uuid; c_nord uuid; c_botanik uuid; c_vet uuid; c_nina uuid; c_hugo uuid; c_ferme uuid; c_lune uuid;
  p_site uuid; p_ident uuid; p_print uuid; p_resa uuid; p_photo uuid; p_news uuid; p_salon uuid;
  q uuid;
  at_paris constant text := 'Europe/Paris';
begin
  -- Identité de l'espace (slug lisible et unique)
  loop
    v_slug := 'studio-lumen-' || substr(md5(gen_random_uuid()::text), 1, 4);
    exit when not exists (select 1 from public.workspaces w where w.slug = v_slug);
  end loop;
  update public.workspaces set
    name = 'Studio Lumen (démo)', slug = v_slug, is_demo = true,
    company_name = 'Studio Lumen', address_line = '12 rue des Artisans', postal_code = '69002',
    city = 'Lyon', country = 'France', email = 'contact@studio-lumen.example', phone = '04 72 00 00 00',
    quote_validity_days = 30,
    quote_terms = 'Acompte de 30 % à la commande, solde à la livraison. Paiement à 30 jours.',
    quote_footer = 'Studio Lumen — studio de design fictif utilisé pour la démonstration d’Atelio.'
  where id = p_workspace_id;

  -- Clients
  insert into public.clients (workspace_id, kind, contact_name, company_name, email, phone, address_line, postal_code, city, notes, created_at)
  values (p_workspace_id, 'company', 'Léa Martin', 'Maison Opale', 'lea.martin@maison-opale.example', '06 00 00 00 01', '4 place Bellecour', '69002', 'Lyon', 'Boutique de décoration. Préfère les échanges par e-mail.', now() - interval '330 days')
  returning id into c_opale;
  insert into public.clients (workspace_id, kind, contact_name, company_name, email, phone, city, created_at)
  values (p_workspace_id, 'company', 'Hugo Petit', 'Atelier Nord', 'hugo@atelier-nord.example', '06 00 00 00 02', 'Lille', now() - interval '280 days')
  returning id into c_nord;
  insert into public.clients (workspace_id, kind, contact_name, company_name, email, phone, city, notes, created_at)
  values (p_workspace_id, 'company', 'Camille Bernard', 'Café Botanik', 'camille@cafe-botanik.example', '06 00 00 00 03', 'Annecy', 'Ouverture d’un second café prévue au printemps.', now() - interval '210 days')
  returning id into c_botanik;
  insert into public.clients (workspace_id, kind, contact_name, company_name, email, city, created_at)
  values (p_workspace_id, 'company', 'Dr Sarah Lefèvre', 'Clinique des Lilas', 'accueil@clinique-lilas.example', 'Villeurbanne', now() - interval '150 days')
  returning id into c_vet;
  insert into public.clients (workspace_id, kind, contact_name, email, phone, city, created_at)
  values (p_workspace_id, 'individual', 'Nina Robert', 'nina.robert@mail.example', '06 00 00 00 05', 'Grenoble', now() - interval '120 days')
  returning id into c_nina;
  insert into public.clients (workspace_id, kind, contact_name, email, city, created_at)
  values (p_workspace_id, 'individual', 'Hugo Garnier', 'hugo.garnier@mail.example', 'Lyon', now() - interval '60 days')
  returning id into c_hugo;
  insert into public.clients (workspace_id, kind, contact_name, company_name, email, city, created_at)
  values (p_workspace_id, 'company', 'Paul Moreau', 'La Ferme du Coteau', 'paul@ferme-coteau.example', 'Valence', now() - interval '35 days')
  returning id into c_ferme;
  insert into public.clients (workspace_id, kind, contact_name, company_name, email, city, created_at)
  values (p_workspace_id, 'company', 'Inès Morel', 'Librairie La Lune', 'ines@librairie-lune.example', 'Lyon', now() - interval '8 days')
  returning id into c_lune;

  -- Projets
  insert into public.projects (workspace_id, client_id, name, description, status, budget_cents, start_date, due_date, progress, created_at)
  values (p_workspace_id, c_opale, 'Refonte du site e-commerce', 'Nouvelle charte, fiches produits et tunnel de commande.', 'in_progress', 840000, d - 40, d + 20, 60, now() - interval '45 days')
  returning id into p_site;
  insert into public.projects (workspace_id, client_id, name, status, budget_cents, start_date, due_date, progress, created_at)
  values (p_workspace_id, c_nord, 'Identité visuelle', 'completed', 320000, d - 90, d - 30, 100, now() - interval '95 days')
  returning id into p_ident;
  insert into public.projects (workspace_id, client_id, name, status, budget_cents, start_date, due_date, progress, created_at)
  values (p_workspace_id, c_botanik, 'Campagne de printemps', 'upcoming', 450000, d + 15, d + 60, 0, now() - interval '10 days')
  returning id into p_print;
  insert into public.projects (workspace_id, client_id, name, status, budget_cents, start_date, due_date, progress, created_at)
  values (p_workspace_id, c_vet, 'Application de prise de rendez-vous', 'on_hold', 1200000, d - 20, d + 75, 25, now() - interval '30 days')
  returning id into p_resa;
  insert into public.projects (workspace_id, client_id, name, status, budget_cents, start_date, due_date, progress, created_at)
  values (p_workspace_id, c_ferme, 'Photos produits', 'in_progress', 180000, d - 12, d - 2, 70, now() - interval '14 days')
  returning id into p_photo;
  insert into public.projects (workspace_id, client_id, name, status, budget_cents, start_date, due_date, progress, created_at)
  values (p_workspace_id, c_opale, 'Newsletter mensuelle', 'completed', 90000, d - 150, d - 100, 100, now() - interval '155 days')
  returning id into p_news;
  insert into public.projects (workspace_id, client_id, name, status, start_date, due_date, progress, created_at)
  values (p_workspace_id, c_lune, 'Stand pour le salon du livre', 'cancelled', d - 50, d - 10, 10, now() - interval '55 days')
  returning id into p_salon;
  -- Dates de fin réelles (le trigger les fixe à « maintenant » à l'insertion)
  update public.projects set completed_at = now() - interval '30 days' where id = p_ident;
  update public.projects set completed_at = now() - interval '100 days' where id = p_news;

  -- Tâches
  insert into public.tasks (workspace_id, project_id, title, status, priority, due_date, created_at) values
    (p_workspace_id, p_site,  'Intégrer les fiches produits',          'in_progress', 'high',   d + 3,  now() - interval '20 days'),
    (p_workspace_id, p_site,  'Valider la maquette du panier',         'todo',        'urgent', d - 2,  now() - interval '15 days'),
    (p_workspace_id, p_site,  'Rédiger les mentions légales',          'todo',        'medium', d + 10, now() - interval '10 days'),
    (p_workspace_id, p_site,  'Configurer le paiement en ligne',       'todo',        'high',   d + 14, now() - interval '9 days'),
    (p_workspace_id, p_photo, 'Retoucher la série « fromages »',        'in_progress', 'urgent', d - 1,  now() - interval '6 days'),
    (p_workspace_id, p_photo, 'Livrer les fichiers haute définition',  'todo',        'high',   d + 1,  now() - interval '6 days'),
    (p_workspace_id, p_resa,  'Atelier de cadrage avec la clinique',   'todo',        'medium', d + 21, now() - interval '18 days'),
    (p_workspace_id, p_print, 'Proposer trois pistes créatives',       'todo',        'medium', d + 18, now() - interval '5 days'),
    (p_workspace_id, null,    'Relancer le devis de la Librairie La Lune', 'todo',    'high',   d,      now() - interval '3 days'),
    (p_workspace_id, null,    'Préparer la facture d’acompte',         'todo',        'low',    d + 5,  now() - interval '2 days'),
    (p_workspace_id, null,    'Mettre à jour le portfolio',            'todo',        'low',    null,   now() - interval '40 days'),
    (p_workspace_id, null,    'Commander les cartes de visite',        'in_progress', 'low',    d - 6,  now() - interval '12 days');
  -- Tâches terminées, réparties sur les huit dernières semaines
  insert into public.tasks (workspace_id, project_id, title, status, priority, due_date, created_at)
  select p_workspace_id, case when i % 3 = 0 then p_site when i % 3 = 1 then p_ident else p_photo end,
         (array['Atelier de lancement', 'Planche de tendances', 'Choix des typographies', 'Arborescence du site',
                'Maquettes mobiles', 'Shooting en studio', 'Sélection des photos', 'Déclinaisons du logo',
                'Charte graphique (PDF)', 'Recette de la page d’accueil'])[i + 1],
         'done', 'medium', d - (i * 5 + 2), now() - make_interval(days => i * 5 + 10)
  from generate_series(0, 9) as i;
  update public.tasks t set completed_at = (t.due_date::timestamp + time '17:00') at time zone at_paris
  where t.workspace_id = p_workspace_id and t.status = 'done';

  -- Devis (ordre chronologique pour une numérotation continue)
  perform private.demo_quote(p_workspace_id, c_opale, p_news, 'Newsletter mensuelle — conception', d - 330, 'accepted', now() - interval '320 days',
    '[{"label":"Gabarit de newsletter","quantity":"1","unit":"forfait","price":60000},{"label":"Rédaction (12 numéros)","quantity":"12","unit":"numéro","price":2500}]');
  perform private.demo_quote(p_workspace_id, c_nord, null, 'Audit de marque', d - 290, 'refused', now() - interval '280 days',
    '[{"label":"Audit et recommandations","quantity":"3","unit":"jour","price":55000}]');
  perform private.demo_quote(p_workspace_id, c_nord, p_ident, 'Identité visuelle', d - 260, 'accepted', now() - interval '250 days',
    '[{"label":"Création du logo","quantity":"1","unit":"forfait","price":180000},{"label":"Charte graphique","quantity":"1","unit":"forfait","price":90000},{"label":"Déclinaisons papeterie","quantity":"4","unit":"pièce","price":12500}]');
  perform private.demo_quote(p_workspace_id, c_botanik, null, 'Menus et signalétique', d - 210, 'accepted', now() - interval '200 days',
    '[{"label":"Conception des menus","quantity":"2","unit":"jour","price":50000},{"label":"Signalétique intérieure","quantity":"6","unit":"panneau","price":8000}]');
  perform private.demo_quote(p_workspace_id, c_vet, null, 'Site vitrine', d - 160, 'refused', now() - interval '150 days',
    '[{"label":"Site vitrine 5 pages","quantity":"1","unit":"forfait","price":380000}]');
  perform private.demo_quote(p_workspace_id, c_nina, null, 'Faire-part de mariage', d - 125, 'accepted', now() - interval '118 days',
    '[{"label":"Création du faire-part","quantity":"1","unit":"forfait","price":45000},{"label":"Impression","quantity":"120","unit":"exemplaire","price":180}]');
  perform private.demo_quote(p_workspace_id, c_vet, p_resa, 'Application de prise de rendez-vous', d - 95, 'accepted', now() - interval '80 days',
    '[{"label":"Ateliers de conception","quantity":"4","unit":"jour","price":60000},{"label":"Maquettes de l’application","quantity":"8","unit":"jour","price":55000},{"label":"Prototype interactif","quantity":"1","unit":"forfait","price":150000}]');
  perform private.demo_quote(p_workspace_id, c_hugo, null, 'Logo pour association', d - 70, 'sent', null,
    '[{"label":"Création du logo","quantity":"1","unit":"forfait","price":70000}]');  -- expiré sans réponse
  perform private.demo_quote(p_workspace_id, c_opale, p_site, 'Refonte du site e-commerce', d - 55, 'accepted', now() - interval '42 days',
    '[{"label":"Direction artistique","quantity":"3","unit":"jour","price":65000},{"label":"Maquettes (desktop et mobile)","quantity":"10","unit":"jour","price":55000},{"label":"Intégration","quantity":"6","unit":"jour","price":50000}]');
  perform private.demo_quote(p_workspace_id, c_ferme, p_photo, 'Photos produits', d - 20, 'accepted', now() - interval '15 days',
    '[{"label":"Shooting en studio","quantity":"2","unit":"jour","price":60000},{"label":"Retouche","quantity":"40","unit":"photo","price":1500}]');
  perform private.demo_quote(p_workspace_id, c_botanik, p_print, 'Campagne de printemps', d - 12, 'sent', null,
    '[{"label":"Concept de campagne","quantity":"1","unit":"forfait","price":150000},{"label":"Affiches et réseaux sociaux","quantity":"12","unit":"visuel","price":15000},{"label":"Suivi d’impression","quantity":"1","unit":"jour","price":50000}]');
  perform private.demo_quote(p_workspace_id, c_lune, null, 'Vitrine de Noël', d - 6, 'sent', null,
    '[{"label":"Conception de la vitrine","quantity":"1","unit":"forfait","price":90000},{"label":"Installation","quantity":"1","unit":"jour","price":45000}]');
  perform private.demo_quote(p_workspace_id, c_nina, null, 'Carnet de voyage illustré', d - 2, 'draft', null,
    '[{"label":"Illustrations","quantity":"15","unit":"illustration","price":6000},{"label":"Mise en page","quantity":"2","unit":"jour","price":45000}]');
  perform private.demo_quote(p_workspace_id, c_ferme, null, 'Étiquettes de bocaux', d, 'draft', null,
    '[{"label":"Création des étiquettes","quantity":"6","unit":"référence","price":12000}]');

  -- Rendez-vous
  insert into public.events (workspace_id, client_id, project_id, title, location, starts_at, ends_at, all_day, description) values
    (p_workspace_id, c_opale, p_site, 'Point d’avancement — Maison Opale', 'Visioconférence',
      ((d + 1)::timestamp + time '10:00') at time zone at_paris, ((d + 1)::timestamp + time '11:00') at time zone at_paris, false, 'Revue des fiches produits.'),
    (p_workspace_id, c_ferme, p_photo, 'Livraison des photos', 'La Ferme du Coteau, Valence',
      ((d + 2)::timestamp + time '14:30') at time zone at_paris, ((d + 2)::timestamp + time '16:00') at time zone at_paris, false, null),
    (p_workspace_id, c_botanik, p_print, 'Présentation des pistes créatives', 'Café Botanik, Annecy',
      ((d + 8)::timestamp + time '09:30') at time zone at_paris, ((d + 8)::timestamp + time '11:00') at time zone at_paris, false, null),
    (p_workspace_id, null, null, 'Salon du design', 'Paris',
      (d + 12)::timestamp at time zone at_paris, (d + 15)::timestamp at time zone at_paris, true, 'Trois jours de salon (stand B12).'),
    (p_workspace_id, c_lune, null, 'Appel — vitrine de Noël', null,
      ((d + 4)::timestamp + time '17:00') at time zone at_paris, ((d + 4)::timestamp + time '17:30') at time zone at_paris, false, null),
    (p_workspace_id, c_vet, p_resa, 'Atelier de cadrage', 'Clinique des Lilas',
      ((d + 21)::timestamp + time '14:00') at time zone at_paris, ((d + 21)::timestamp + time '17:00') at time zone at_paris, false, null),
    (p_workspace_id, c_nina, null, 'Rendez-vous avec Nina Robert', 'Atelier',
      ((d - 3)::timestamp + time '15:00') at time zone at_paris, ((d - 3)::timestamp + time '16:00') at time zone at_paris, false, null),
    (p_workspace_id, null, null, 'Comptabilité du mois', null,
      (d - 1)::timestamp at time zone at_paris, d::timestamp at time zone at_paris, true, null);

  -- Journal : on remplace les entrées « créé » horodatées maintenant par un historique plausible
  delete from public.activity_logs where workspace_id = p_workspace_id;
  insert into public.activity_logs (workspace_id, actor_id, entity_type, entity_id, action, summary, changes, created_at)
  select p_workspace_id, null::uuid, 'quote', q2.id, 'updated', q2.number, array['accepted_at', 'status'], q2.accepted_at
  from public.quotes q2 where q2.workspace_id = p_workspace_id and q2.accepted_at > now() - interval '60 days'
  union all
  select p_workspace_id, null::uuid, 'quote', q2.id, 'created', q2.number, '{}', q2.created_at
  from public.quotes q2 where q2.workspace_id = p_workspace_id and q2.created_at > now() - interval '30 days'
  union all
  select p_workspace_id, null::uuid, 'client', c.id, 'created', coalesce(c.company_name, c.contact_name), '{}', c.created_at
  from public.clients c where c.workspace_id = p_workspace_id and c.created_at > now() - interval '40 days'
  union all
  select p_workspace_id, null::uuid, 'task', t.id, 'updated', t.title, array['completed_at', 'status'], t.completed_at
  from public.tasks t where t.workspace_id = p_workspace_id and t.status = 'done' and t.completed_at > now() - interval '15 days'
  union all
  select p_workspace_id, null::uuid, 'project', p.id, 'created', p.name, '{}', p.created_at
  from public.projects p where p.workspace_id = p_workspace_id and p.created_at > now() - interval '20 days';
end;
$$;

revoke all on function private.seed_demo_workspace(uuid) from public;
