# Décisions techniques — Atelio

Journal des décisions (format ADR simplifié). Toute nouvelle décision importante ou nouvelle dépendance y est consignée.

---

### DT-001 — Supabase cloud gratuit, deux projets, sans Docker
_13/11/2026 — validée_

- **Contexte** : plan Supabase gratuit ; l'utilisateur ne souhaite pas gérer Docker.
- **Options** : (A) Supabase local via Docker ; (B) deux projets cloud `atelio-dev` / `atelio-prod` ; (C) un seul projet cloud.
- **Décision** : B. Migrations appliquées via `npx supabase` (aucune installation globale).
- **Raisons** : aucune maintenance Docker ; la production reste propre et ne casse pas pendant le développement ; les tests RLS tournent sur dev. C écarté (mélange dev / prod), A écarté (Docker).
- **Conséquences** : les deux emplacements gratuits sont utilisés ; les tests RLS nécessitent le réseau et nettoient leurs données.

### DT-002 — Hébergement Vercel Hobby, maintien actif et mode démo
_13/11/2026 — validée_

- **Contexte** : projet portfolio ; un projet Supabase gratuit est mis en pause après 7 jours d'inactivité ; un recruteur ne créera pas de compte.
- **Décision** : cron Vercel quotidien (requête légère + reset démo) ; bouton « Essayer la démo » vers un compte pré-rempli, signalé par un bandeau, réinitialisé chaque nuit.
- **Conséquences** : script de seed démo et route cron protégée par `CRON_SECRET`. SMTP Resend optionnel au déploiement (le SMTP intégré Supabase est très limité).

### DT-003 — TypeScript 6.0.x (pas 7.x)
_13/11/2026 — validée_

- **Contexte** : `typescript@latest` = 7.0.2 (portage natif), mais `typescript-eslint` déclare `typescript >=4.8.4 <6.1.0`.
- **Décision** : figer TypeScript 6.0.x (6.0.3 au 13/11/2026). Réévaluer quand typescript-eslint supportera TS 7.

### DT-004 — ESLint 9.x (pas 10.x)
_13/11/2026 — validée_

- **Contexte** : `eslint-config-next` 16.4 dépend de `eslint-plugin-react` et `eslint-plugin-import`, qui ne déclarent pas ESLint 10.
- **Décision** : figer ESLint 9.x.

### DT-005 — Chiffre d'affaires suivi = devis acceptés
_13/11/2026 — validée_

- **Contexte** : pas de module de facturation en V1.
- **Décision** : CA suivi = somme des devis au statut « Accepté » ; pipeline = devis envoyés non expirés.

### DT-006 — Statut « Expiré » dérivé
_13/11/2026 — validée_

- **Décision** : l'enum stocké ne contient pas `expired`. Un devis est affiché « Expiré » s'il est `sent` et que `valid_until` est dépassée. Toujours exact, aucune tâche planifiée nécessaire.

### DT-007 — Multi-membres prêt, invitations en V2
_13/11/2026 — validée_

- **Décision** : `workspace_members` avec rôles et RLS par appartenance dès la V1 ; un espace personnel créé à l'inscription ; invitations reportées en V2.

### DT-008 — Authentification e-mail + mot de passe
_13/11/2026 — validée_

- **Décision** : Supabase Auth e-mail / mot de passe, confirmation et réinitialisation. Identité côté serveur via `getClaims()`. OAuth Google en V2.

### DT-009 — PDF avec @react-pdf/renderer côté serveur
_13/11/2026 — validée_

- **Options** : @react-pdf/renderer ; Puppeteer / Chromium headless.
- **Décision** : @react-pdf/renderer dans un Route Handler (runtime Node), police embarquée pour les accents et le symbole €. Puppeteer écarté (trop lourd pour Vercel).

### DT-010 — npm comme gestionnaire de paquets
_13/11/2026 — validée_ — déjà installé (npm 11), aucune installation supplémentaire.

### DT-011 — Ordre de la roadmap : tableau de bord après les modules métier
_13/11/2026 — validée_

- **Raison** : sans données, le tableau de bord n'afficherait que des zéros ou des données fictives. Une coquille vide existe dès la phase de design.

### DT-012 — Conventions de données
_13/11/2026 — validée_

- Montants en centimes (`bigint`), TVA en points de base (2000 = 20 %), arrondi au centime par ligne.
- Calcul des devis dans une fonction Postgres (RPC, atomique) ; calcul TypeScript identique pour l'aperçu, testé sur les mêmes cas.
- Numérotation `DEV-AAAA-NNNN` par espace via une table `quote_counters` verrouillée (ajoutée à la liste de tables initiale pour garantir l'unicité en cas de concurrence).
- Journal d'activité alimenté par triggers.
- Espace actif dans l'URL : `/w/[slug]/…`.
- Interface et routes en français, code en anglais.

### DT-013 — Dépendances complémentaires
_13/11/2026 — validée_

| Paquet | Usage |
|---|---|
| @react-pdf/renderer | PDF des devis |
| @dnd-kit/core | Kanban des projets |
| @tanstack/react-table | Tableaux filtrables (DataTable shadcn) |
| sonner | Notifications (recommandé par shadcn) |
| react-day-picker | Sélecteur de date (composant Calendar shadcn) |

Le calendrier principal est développé sur mesure avec date-fns (FullCalendar écarté : lourd et difficile à harmoniser avec le design).

### DT-014 — shadcn/ui : base Radix, paquet `cn`, police Geist
_13/11/2026 — validée_

- shadcn 4.23 initialisé avec la base **Radix** (`radix-ui`), style `new-york`, couleur de base `neutral`, variables CSS. Radix est la base la plus éprouvée et la plus documentée.
- shadcn 4.x installe le paquet **`cn`** (publié par le mainteneur de shadcn, dépôt `shadcn-ui/cn`) en remplacement de `clsx` + `tailwind-merge`. Origine vérifiée.
- Police **Geist** (fournie par `next/font`). Couleur principale provisoire : indigo-600 ; palette complète en phase 2.
- React Compiler **non activé** pour l'instant ; Playwright limité à **Chromium** (Firefox / WebKit avant la mise en ligne).

### DT-015 — Configuration Next.js 16 par défaut conservée
_13/11/2026 — confirmée en phase 3 (14/11/2026)_

- Le gabarit officiel `create-next-app@16.4.6` active `cacheComponents` et `partialPrefetching`, et utilise le loader `@tailwindcss/turbopack` (pas de PostCSS).
- **Décision** : conserver ces valeurs par défaut officielles.
- **Conséquence** : les lectures de session (cookies) sont placées dans des frontières `<Suspense>`, jamais au niveau d'un layout. Compatible avec l'authentification Supabase, à condition d'appeler `await connection()` avant la lecture de session (voir DT-020).
- `typecheck` exécute `next typegen` avant `tsc`, car les types globaux `LayoutProps` / `PageProps` sont générés.

### DT-016 — Vulnérabilités npm audit des outils de développement
_13/11/2026 — acceptée temporairement_

- `npm audit` signale 7 vulnérabilités modérées (`deepmerge` via la CLI shadcn, `minimatch` via typescript-eslint / ts-morph).
- Elles ne concernent que des **outils de développement**, jamais exécutés dans le navigateur ni en production. `npm audit fix --force` rétrograderait shadcn en 1.0.0 (cassant) : non appliqué.
- **Action** : revérifier à chaque mise à jour des dépendances.
- Note : ESLint 9 est signalé « plus supporté » par npm ; il reste requis par `eslint-config-next` 16.4 (DT-004). Passer à ESLint 10 dès que l'écosystème le permet.

### DT-017 — Design system V1
_13/11/2026 — validée_

- **Mode clair uniquement** en V1 (bloc `.dark` retiré). La variante `dark` reste déclarée pour que les classes des composants shadcn compilent ; un mode sombre pourra être ajouté en redéfinissant les tokens.
- **Palette** (`src/app/globals.css`) : neutres légèrement bleutés (teinte 265), fond d'application `canvas` #F8F9FB, surfaces blanches, `primary` indigo-600, `info` blue-600, rayon 8 px.
- **Tokens de statut** `status-{neutral,info,progress,warning,success,danger}` (+ `-foreground`), utilisés via `StatusBadge`. Correspondance : brouillon / à venir / annulé → neutral ; envoyé → info ; en cours → progress ; en attente / expiré → warning ; terminé / accepté → success ; en retard / refusé → danger.
- **Densité compacte** : texte de base 14 px, titres de page 24 px.
- Animations désactivées si `prefers-reduced-motion`.

### DT-018 — Coquille applicative et cacheComponents
_13/11/2026 — validée_

- Navigation définie une seule fois dans `src/components/layout/navigation.ts`.
- Sidebar shadcn (`collapsible="icon"`) : dépliée à partir de 1280 px, en icônes en dessous, panneau latéral sous 768 px. Le choix manuel de l'utilisateur prime pendant la session (non persisté ; le cookie shadcn n'est pas lu côté serveur pour garder la coquille statique).
- Avec `cacheComponents`, les composants lisant l'URL (`useParams`, `usePathname`) sont dans des frontières `<Suspense>` ; les pages des modules sont pré-rendues partiellement (◐ au build). Le layout `/w/[slug]` ne lit pas `params`.
- `/w/<slug>` redirige vers `/w/<slug>/tableau-de-bord` (redirection `next.config.ts`).
- Composants shadcn retouchés : libellés d'accessibilité traduits (sidebar, sheet, breadcrumb) ; `use-mobile.ts` réécrit sur `useMediaQuery` et largeur de `SidebarMenuSkeleton` rendue déterministe (règles `react-hooks` de React 19).
- ~~Temporaire : les pages `/w/[slug]/…` sont accessibles sans connexion~~ → protégées depuis la phase 3 (DT-020) ; contrôle d'appartenance à l'espace en phase 4.

### DT-019 — Projet Supabase de développement et configuration de l'authentification
_14/11/2026 — validée_

- Projet de développement : **« Atelio »** (ref `sngvhoygizlvxwwqnsyi`), région **eu-west-2 (Londres)**, plan gratuit. Le projet de production (`atelio-prod`, région Paris) sera créé en phase 12.
- CLI Supabase en dépendance de développement (`supabase@3.1.0`), utilisée via `npx supabase`, liée au projet (`supabase link`).
- Configuration de l'authentification versionnée dans `supabase/config.toml` et appliquée par `npx supabase config push` après revue de `npx supabase config diff`. Les réglages hors authentification sont alignés sur les valeurs du projet distant pour que `push` ne modifie rien d'autre.
- Réglages appliqués : URLs de redirection `http://localhost:3000/**`, mot de passe de 8 caractères minimum avec lettres et chiffres, **confirmation par e-mail désactivée sur le projet de dev** (tests automatisés ; le SMTP gratuit n'envoie qu'aux membres de l'équipe). Elle sera **activée en production**.
- **Modèles d'e-mails en français** (`supabase/templates/`) : prêts mais **non appliqués**, car le plan gratuit refuse leur modification avec le SMTP par défaut (`entitlement_required`). À activer avec un SMTP personnalisé (Resend) en phase 12. En attendant, les e-mails par défaut (anglais) fonctionnent : leurs liens arrivent sur `/auth/confirm` avec un `code` PKCE.

### DT-020 — Architecture de l'authentification
_14/11/2026 — validée_

- **Clés Supabase** : `sb_publishable_…` (navigateur et serveur, soumise à la RLS) et `sb_secret_…` (serveur uniquement : `src/lib/supabase/admin.ts`, `server-only`, utilisée par les tests pour créer et supprimer des comptes).
- **Proxy** (`src/proxy.ts`) : rafraîchit la session à chaque requête, redirige les visiteurs non connectés de `/w/*`, `/demarrage` et `/reinitialiser-mot-de-passe` vers `/connexion?next=…`, et les utilisateurs connectés hors des pages de connexion et d'inscription.
- **Vérification serveur** : `getCurrentUser()` / `requireUser()` (`src/lib/auth/session.ts`) via `getClaims()`, jamais `getSession()`. Le menu du compte de la sidebar sert aussi de garde côté serveur.
- **`await connection()` avant la lecture de session** : avec `partialPrefetching`, Next pré-rend avec les cookies disponibles, et Supabase lit l'heure (expiration du JWT), ce qui provoquait une erreur « Date.now() pendant le pré-rendu » et bloquait l'interactivité du menu.
- `getClaims()` vérifie la signature du JWT localement : une session reste valide jusqu'à son expiration (1 h) même si le compte est supprimé. L'accès aux données reste protégé par la RLS (phase 4).
- **Écritures** via Server Actions (`src/features/auth/actions.ts`) : validation Zod côté serveur, erreurs traduites en français sans exposer les messages techniques (`src/lib/auth/errors.ts`).
- **Sécurité** : paramètre `next` filtré contre les redirections ouvertes (`safeNextPath`) ; message de connexion générique ; réponse neutre pour « mot de passe oublié » et pour l'inscription avec confirmation (pas d'énumération des comptes) ; `logging.serverFunctions: false` dans `next.config.ts` pour ne pas écrire les mots de passe dans les journaux de développement.
- La déconnexion passe par un `<form action={signOut}>` (plus fiable qu'un appel dans un gestionnaire de menu).
- `/demarrage` est une page temporaire jusqu'à la création des espaces (phase 4).

### DT-021 — Tests E2E authentifiés
_14/11/2026 — validée_

- Les tests E2E utilisent le projet Supabase de dev (`.env.local` chargé par `playwright.config.ts`).
- Projet Playwright `setup` (`tests/e2e/auth.setup.ts`) : crée un compte confirmé via l'API d'administration, se connecte et enregistre la session (`playwright/.auth/`, ignoré par Git), réutilisée par les tests de la coquille.
- Comptes de test `e2e-…@example.com`, supprimés par `tests/e2e/global-teardown.ts`.
- L'envoi réel d'e-mails n'est pas testé (quota du SMTP gratuit).
- Next.js 16 conserve les pages visitées dans le DOM, masquées (React Activity) : les tests utilisent `byLabel` / `byText` / `byTestId` (`tests/e2e/helpers/locators.ts`), filtrés sur les éléments visibles.

### DT-022 — Modèle d'espaces de travail et RLS (migration 0001)
_14/11/2026 — validée_

- Tables `profiles`, `workspaces`, `workspace_members` (+ enum `workspace_role`). Migration `supabase/migrations/20261114065237_workspaces.sql`, appliquée avec `npm run db:push` (`supabase db push --remote`, aperçu `--dry-run` avant).
- **Création automatique** à l'inscription (trigger `on_auth_user_created` → `private.provision_user`) : profil, espace « Espace de <Prénom> » (ou « Mon espace »), slug `espace-de-prenom-xxxx` (suffixe aléatoire, accents retirés par `unaccent`), rôle `owner`. Rattrapage des comptes existants dans la migration.
- **Schéma `private`** (non exposé par l'API) pour toutes les fonctions `SECURITY DEFINER` (`is_workspace_member`, `has_workspace_role`, `shares_workspace_with`, `provision_user`, `slugify`), avec `search_path = ''`. Évite la récursion RLS sur `workspace_members`.
- **Droits** : aucun accès `anon` ; `authenticated` en lecture ; écritures limitées **par colonne** (`profiles.full_name / avatar_url`, `workspaces.name / default_vat_rate_bp`). Aucune création / suppression d'espace ni gestion des membres par l'API en V1.
- **Politiques** : lecture des espaces et membres par les membres ; modification d'un espace par `owner` / `admin` ; profils visibles par soi-même et les co-membres.
- **Comptes supprimés** : `workspaces.created_by` passe à NULL ; les espaces orphelins seront gérés par la suppression de compte (phase 11). Les tests suppriment explicitement les espaces de leurs comptes.
- Types TypeScript générés (`npm run db:types` → `src/types/database.types.ts`), utilisés par les trois clients Supabase.
- Tests : `npm run test:rls` (18 tests, deux utilisateurs réels, projet de dev).

### DT-023 — Accès à un espace dans l'application
_14/11/2026 — validée_

- `WorkspaceGate` (layout `/w/[slug]`, dans `<Suspense>`) : session + espace lisible via la RLS, sinon `notFound()` → 404 identique pour un espace inexistant ou appartenant à un autre utilisateur.
- `getWorkspaceBySlug` mis en cache par requête (`React.cache`) : partagé entre la garde et le nom de l'espace affiché dans la sidebar.
- Après connexion, inscription ou nouveau mot de passe, les Server Actions redirigent **directement** vers `/w/<slug>/tableau-de-bord` (`getHomePath`). Une redirection d'action vers un Route Handler n'est pas suivie par le routeur client. `/demarrage` devient un Route Handler HTTP, utilisé par le proxy et les liens reçus par e-mail.
- `connection()` est appelé dans `createClient()` (client serveur) : toute requête Supabase est évaluée au moment de la requête (DT-020).
- Identifiants des champs de formulaire générés par `useId()` : évite les doublons d'`id` entre pages conservées en mémoire par Next (accessibilité).
- En développement, chaque 404 volontaire d'un espace produit dans le terminal un message « Could not validate `instant` » : comportement attendu, sans effet en production.
- **Session valide sans espace** (compte supprimé dont le jeton n'a pas expiré, anomalie) : `/demarrage` et les actions d'authentification **ferment la session** avant de rediriger vers `/connexion?erreur=aucun-espace`. Sans cela, le proxy renvoyait l'utilisateur « connecté » vers `/demarrage` → boucle de redirection infinie (bug trouvé au contrôle visuel de la phase 5, couvert par un test E2E).

### DT-024 — Module Clients (modèle pour les modules métier)
_14/11/2026 — validée_

- **Migration 0002** : table `clients` (type entreprise / particulier, contact, entreprise, e-mail, téléphone, adresse structurée, pays, notes), contraintes alignées sur le schéma Zod, `created_by` rempli par défaut avec `auth.uid()` et non modifiable (droits par colonne), `workspace_id` figé après création.
- **Recherche** : colonne générée `search_text` = `private.normalize_search(...)` (minuscules, sans accents), index trigrammes (`pg_trgm`) ; côté application, `containsPattern()` applique la même normalisation et échappe les jokers SQL. Recherche, filtre (type), tri et page dans l'URL, validés par Zod (valeur invalide → valeur par défaut).
- **Structure de module** (à reproduire) : `src/features/<module>/` → `constants.ts`, `schemas.ts` (formulaire + paramètres d'URL + conversions ligne ↔ formulaire), `queries.ts` (`server-only`), `actions.ts` (Server Actions : Zod → résolution de l'espace par slug via la RLS → requête filtrée par `workspace_id` → `refresh()`), `components/`.
- **Interface** : liste (tableau ≥ md, cartes sur mobile), création / modification dans un panneau latéral (`Sheet`), suppression avec `AlertDialog`, fiche détaillée en page, notifications `sonner` (wrapper `components/ui/toaster.tsx` sans `next-themes`). Pas de TanStack Table : pagination et tri côté serveur.
- Hook partagé `useServerActionForm` (`src/hooks/`) : l'action reçoit les valeurs **saisies**, le serveur applique lui-même le schéma (validation + transformations).
- Erreurs PostgreSQL traduites par `dbErrorMessage()` (`src/lib/db-errors.ts`) ; suppression bloquée par clé étrangère (devis, phase 8) déjà prévue (`23503`).

### DT-025 — Journal d'activité générique
_14/11/2026 — validée_

- Table `activity_logs` (espace, auteur, type et identifiant d'entité, action `created` / `updated` / `deleted`, libellé conservé, champs modifiés). Écrite **uniquement** par le trigger `private.log_activity(entity_type, colonne_libellé, colonne_repli)` ; lecture seule pour les membres.
- Les mises à jour sans changement réel ne sont pas journalisées ; les suppressions en cascade d'un espace supprimé sont ignorées (évite une violation de clé étrangère).
- Pour un nouveau module : ajouter son `entity_type` à la contrainte CHECK et poser le trigger sur sa table.

### DT-026 — Droits du rôle d'administration sur le schéma `private`
_14/11/2026 — validée_

- Migration 0003 : `service_role` reçoit `USAGE` sur `private` et `EXECUTE` sur `private.normalize_search`. Sans cela, un insert par le client d'administration (seed, démo, tests) échouait (« permission denied for function normalize_search ») à cause de la colonne générée. Test RLS de non-régression ajouté.
- Règle : toute fonction `private` utilisée par une colonne générée ou une contrainte doit aussi être accordée à `service_role`.

### DT-027 — Module Projets
_14/11/2026 — validée_

- **Migration 0004** : enum `project_status` (`upcoming`, `in_progress`, `on_hold`, `completed`, `cancelled`), table `projects` (nom, client facultatif, statut, `budget_cents`, `start_date`, `due_date`, `progress` 0-100, description, `completed_at`, `search_text`), contraintes (ordre des dates, budget ≥ 0, avancement borné), RLS et droits par colonne identiques aux clients, journal (`entity_type = 'project'`).
- **Intégrité entre espaces** : la RLS ne vérifie pas l'espace d'une ligne *référencée*. Le client d'un projet est donc contraint par une **clé étrangère composite** `(client_id, workspace_id) → clients(id, workspace_id)` (contrainte `UNIQUE (id, workspace_id)` ajoutée sur `clients`), avec `ON DELETE SET NULL (client_id)` : supprimer un client détache ses projets sans les supprimer. À reproduire pour toute référence entre tables métier (tâches → projets, devis → clients).
- `completed_at` est géré par trigger (passage au statut terminé / sortie de ce statut) et n'est pas modifiable directement.
- **Argent** : `src/lib/money.ts` (saisie « 1 500,50 » → 150050 centimes, refus de plus de 2 décimales ; affichage `Intl` fr-FR). **Dates** : `src/lib/dates.ts` (jour courant à Paris, validation `AAAA-MM-JJ`, affichage sans décalage de fuseau) ; champs date natifs du navigateur (pas de bibliothèque de calendrier).
- **Retard** : projet actif (`upcoming`, `in_progress`, `on_hold`) dont l'échéance est strictement passée (jour de Paris).
- **Kanban** : `@dnd-kit/core` (souris, toucher avec délai, clavier via une poignée dédiée, annonces en français), mise à jour optimiste avec `useOptimistic` (retour automatique en cas d'échec serveur), menu « Changer le statut » sur chaque carte. Pas de réordonnancement manuel : cartes triées par échéance. Vue limitée à 300 projets.
- Vue (`view=kanban`), recherche, statut, client, tri et page dans l'URL.
- Journal partagé : `src/features/activity/` (`getEntityActivity`, `ActivityTimeline` avec libellés de champs par module). Composants partagés `ConfirmDeleteDialog` et `Panel` / `InfoItem` / `UpcomingNotice`.
- **Règle** : un composant client ne doit jamais importer de valeur depuis un fichier `server-only` (`queries.ts`) ; les types et fonctions utilitaires partagés vont dans `types.ts` (erreur rencontrée : visible uniquement au chargement de la page ou au build, pas au typecheck).
- Les menus déroulants de filtre reçoivent leur libellé explicitement (`<SelectValue>{label}</SelectValue>`) : sinon Radix ne l'affiche qu'après l'hydratation (champ vide visible brièvement).

### DT-028 — Isolation des suites E2E
_14/11/2026 — validée_

- Les suites qui créent des données (Clients, Projets) utilisent `isolatedUser()` (`tests/e2e/helpers/isolated-user.ts`) : un utilisateur et un espace propres au fichier, connectés une seule fois (storageState sous forme de fonction, lu après la connexion). Les suites en lecture seule (coquille) gardent la session partagée d'`auth.setup.ts`.
- Cause : deux suites en parallèle sur le même espace faussaient les compteurs et les états vides.
- Toute vérification d'un changement fait par une action serveur se fait après rechargement de la page (sinon le test peut se terminer avant l'enregistrement).

### DT-029 — Module Tâches
_14/11/2026 — validée_

- **Migration 0005** : enums `task_status` (`todo`, `in_progress`, `done`) et `task_priority` (`low`, `medium`, `high`, `urgent` — l'ordre de l'enum sert au tri), table `tasks` (titre, projet facultatif, statut, priorité, échéance, description, `completed_at`, `search_text`), RLS et droits par colonne, journal (`entity_type = 'task'`).
- Projet d'une tâche : **clé étrangère composite** vers `projects(id, workspace_id)` (contrainte `UNIQUE` ajoutée sur `projects`), `ON DELETE SET NULL (project_id)` : supprimer un projet détache ses tâches, avec avertissement dans la confirmation.
- `completed_at` géré par trigger (statut `done`), non modifiable directement.
- **Retard** : tâche non terminée dont l'échéance est strictement passée (jour de Paris). Filtres d'échéance : en retard, aujourd'hui, cette semaine (jusqu'au dimanche, calcul en dates ISO sans fuseau), sans échéance.
- **Interface** : liste type « liste de travail » ; ajout rapide (titre + Entrée, focus conservé) ; case « terminée » optimiste (`useOptimistic`) avec notification « Tâche terminée » et bouton **Annuler** ; tâches terminées masquées par défaut (`done=1` pour les afficher) ; modification et suppression dans un panneau latéral (pas de page dédiée) ; compteur « N à terminer · N en retard » (lien vers le filtre).
- Fiche projet : tâches du projet, compteur « x / y terminées », ajout rapide rattaché au projet.
- Pas de personne assignée en V1 (collaboration en V2 : colonne ajoutable sans refonte).

### DT-030 — Devis : modèle de données, calculs et règles métier (migration 0006)
_14/11/2026 — validée_

- Tables `quotes`, `quote_items`, `quote_counters` ; enum `quote_status` (`draft`, `sent`, `accepted`, `refused`). « Expiré » est **dérivé** (envoyé et `valid_until` dépassée), conformément à DT-006.
- **Aucune écriture directe** : les utilisateurs n'ont que `SELECT` (et `DELETE` des brouillons). Toute écriture passe par trois fonctions `SECURITY DEFINER` exposées en RPC : `save_quote` (création / modification d'un brouillon, remplacement des lignes, **recalcul de tous les montants**, montants transmis ignorés), `set_quote_status` (brouillon → envoyé → accepté / refusé, sans retour arrière) et `duplicate_quote`. Elles vérifient l'accès via `private.assert_workspace_access` (membre, ou `service_role` pour les scripts de démo).
- **Calcul** : `private.quote_line_amounts` — HT ligne = arrondi(quantité × PU), TVA ligne = arrondi(HT × taux / 10 000), arrondi demi vers le haut, totaux = sommes. Miroir exact en TypeScript (`src/features/quotes/calculations.ts`, entiers `BigInt`) pour l'aperçu en direct. **Les deux sont vérifiés sur les mêmes cas** (`tests/fixtures/quote-calculations.json`).
- **Numérotation** `DEV-AAAA-NNNN` par espace et par année, attribuée à la création du brouillon (`private.next_quote_number`, `INSERT … ON CONFLICT DO UPDATE` : verrou de ligne, aucun doublon en concurrence — testé avec 6 créations simultanées). Un brouillon supprimé laisse un trou (acceptable pour des devis).
- **Envoi** : instantanés `client_snapshot` et `issuer_snapshot` (coordonnées figées) ; un devis envoyé n'est plus modifiable (on le **duplique**) ni supprimable.
- **Intégrité** : client du même espace (clé composite, `ON DELETE RESTRICT` : un client ayant des devis ne peut pas être supprimé), projet du même espace (`SET NULL`), lignes liées au devis par clé composite (`CASCADE`). Contraintes de cohérence `total = HT + TVA` en base.
- **Franchise en base de TVA** : `workspaces.vat_exempt` ; `save_quote` force alors tous les taux à 0 et mémorise `quotes.vat_exempt`.
- Informations de l'entreprise (émetteur) ajoutées à `workspaces` (raison sociale, adresse, contact, SIRET à 14 chiffres, n° de TVA, validité par défaut, conditions, mentions de bas de page), modifiables par owner / admin (droits par colonne).
- Erreurs métier : `AT001` devis non modifiable, `AT002` introuvable, `AT003` transition impossible, `AT004` lignes invalides.
- `tsconfig` : cible passée de ES2017 à **ES2022** (littéraux `BigInt`). Après un tel changement, supprimer `tsconfig.tsbuildinfo` et `.next/cache/.tsbuildinfo` (caches incrémentaux qui conservent l'ancienne cible).

### DT-031 — Devis : écrans, PDF et paramètres (phase 8b)
_14/11/2026 — validée_

- **Paramètres** (`/w/[slug]/parametres`) : nom de l'espace, informations de l'entreprise (raison sociale, adresse, contact, SIRET validé à 14 chiffres, n° de TVA), franchise de TVA (interrupteur), taux de TVA par défaut, durée de validité, conditions par défaut, mentions de bas de page. Modifiable par owner / admin (lecture seule sinon).
- **Éditeur** sur une page dédiée (`/devis/nouveau`, `/devis/[id]/modifier`, brouillons uniquement — sinon redirection vers la fiche) : `useFieldArray`, lignes ajoutables / réordonnables / supprimables, unités suggérées (`datalist`), totaux et récapitulatif de TVA en direct (calcul `BigInt` identique à la base), barre d'actions collante. Le navigateur n'envoie **aucun montant**.
- **Fiche devis** : aperçu HTML fidèle au PDF (mêmes montants enregistrés), actions selon le statut (modifier, marquer comme envoyé avec confirmation, accepté / refusé, PDF, dupliquer, supprimer un brouillon), mention « devis figé » après envoi, historique.
- **Coordonnées affichées** (`features/quotes/document.ts`) : instantanés figés s'ils existent (devis envoyé), sinon données actuelles (brouillon).
- **PDF** (`/w/[slug]/devis/[id]/pdf`, Route Handler, `@react-pdf/renderer` 4.9) : Helvetica intégrée (WinAnsi : accents, €, ’, —, « » vérifiés dans le flux du PDF) ; l'espace fine insécable d'`Intl` (U+202F, absente de WinAnsi) est remplacée par une espace insécable ; **césure automatique désactivée** (règles anglaises par défaut) ; filigrane « BROUILLON » ; en-tête répété sur plusieurs pages ; numéro de page. Accès vérifié comme les pages (session + RLS, 404 sinon). L'option `export const runtime` est interdite avec `cacheComponents` (le runtime Node est celui par défaut).
- Liste : recherche (numéro, objet), filtres statut (dont « Expiré » dérivé) et client, tableau / cartes mobiles. Fiche client : liste de ses devis, bouton « Nouveau devis » prérempli, avertissement : suppression refusée tant que des devis existent.
- Correction d'un écart d'hydratation du Kanban (phase 6) : `DndContext` reçoit un `id` stable (`useId`).
- **Tests E2E** : serveur de développement compilant à la volée → `workers: 3`, `timeout: 60 s`, `expect.timeout: 10 s` (faux échecs sous charge avec 4 navigateurs et 5 s).
- La suppression d'un espace contenant des devis fonctionne en cascade malgré le `RESTRICT` client → devis (vérifié).

### DT-032 — Tableau de bord : agrégats SQL et Recharts (phase 9)
_14/11/2026 — validée_

- **Une fonction de lecture** `public.get_dashboard_stats(workspace_id) → jsonb` (migration 0007) : PostgREST n'expose pas `sum()` par défaut, et télécharger tous les devis pour les additionner côté Next serait coûteux. **SECURITY INVOKER** (la RLS des tables s'applique) + contrôle explicite `private.is_workspace_member` → `42501` pour un espace étranger ; exécutable par `authenticated` uniquement. Réponse validée par Zod (`features/dashboard/schemas.ts`).
- **Définitions** : projets en cours = statut `in_progress` ; tâches à terminer = non terminées, en retard = échéance strictement passée ; devis en attente / pipeline = envoyés et `valid_until >= aujourd'hui` ; **CA suivi = tous les devis acceptés** (HT et TTC), **rattachés au mois de leur acceptation** (`accepted_at`, choix validé par l'utilisateur).
- **Fuseau** : jour, mois et semaines (lundi → dimanche) calculés en heure de Paris dans la base ; testé avec un devis accepté à 00 h 30 le 1er du mois (veille en UTC).
- Séries complétées à zéro en SQL (`generate_series`) : 6 mois, 8 semaines.
- **Recharts 3.8** via `npx shadcn@4.23.0 add chart` (composant `chart.tsx`, prévu dans la stack ; `globals.css` inchangé, couleurs `--chart-*` existantes). Graphiques dans un composant client ; résumé textuel `sr-only` pour les lecteurs d'écran.
- **Activité récente** : 10 derniers événements de `activity_logs` ; existence actuelle de chaque élément vérifiée (une requête par type) → lien vers la fiche, sinon libellé conservé sans lien. Les transitions de devis sont reconnues à leurs colonnes (`sent_at`, `accepted_at`, `refused_at`) → « Devis envoyé / accepté / refusé ». Les tâches n'ont pas de page de détail : pas de lien.
- Tests E2E : une insertion groupée supabase-js envoie `NULL` pour les colonnes absentes d'une ligne → toujours fournir les mêmes colonnes. Avec le rendu en streaming, une 404 se vérifie par le contenu (« Page introuvable ») et non par le statut HTTP.

### DT-033 — Calendrier : rendez-vous, fuseau et vues (phase 10)
_14/11/2026 — validée_

- **Table `events`** (migration 0008) : `starts_at` / `ends_at` en `timestamptz`, **fin exclusive** strictement après le début, durée max. 366 jours, `all_day`, `location` (ajouté au schéma prévu), client et projet facultatifs du même espace (clés composites, `ON DELETE SET NULL`). Droits d'écriture par colonne (`workspace_id` et `created_by` non modifiables), RLS membre, journal `event`.
- **Journée entière** : de 00:00 (Paris) du premier jour à 00:00 du lendemain du dernier jour. Le formulaire manipule des dates et heures « murales » de Paris ; la conversion se fait côté application.
- **Fuseau sans dépendance** (`src/lib/dates.ts`, `Intl`) : `parisToUtcIso` / `utcToParis`. Heure inexistante (printemps, 02:30) décalée d'une heure ; heure ambiguë (automne) = première occurrence. `@date-fns/tz` écarté (pas nécessaire).
- **Agrégation en lecture** (rien n'est copié) : rendez-vous **chevauchant** la période, échéances des tâches (terminées barrées), début / échéance des projets (hors annulés), fin de validité des **devis envoyés**. 500 lignes max. par type et par période.
- **Vues** : mois (semaines complètes du lundi au dimanche, 3 éléments par case puis « +N » vers la semaine) ; semaine **agenda** (colonnes à partir de `lg`, liste en dessous) — choix validé plutôt qu'une grille horaire. Mobile : mini-grille avec points + liste des jours occupés.
- **État dans l'URL** (`view`, `date`, `hide`) : navigation et filtres sont des liens (rendu serveur), seuls le panneau et ses déclencheurs sont côté client. Valeurs invalides → valeurs par défaut.
- Liens : projet et devis vers leur fiche ; tâche vers la liste filtrée sur son titre (pas de fiche) ; rendez-vous → panneau de modification.
- `addDaysIso` déplacé dans `src/lib/dates.ts` (réexporté par `features/tasks/status.ts`).

### DT-034 — Statistiques : périodes, comparaison et définitions (phase 11)
_14/11/2026 — validée_

- **Fonction** `public.get_statistics(workspace_id, du, au) → jsonb` (migration 0009), même modèle que DT-032 : SECURITY INVOKER, contrôle `private.is_workspace_member` (42501), période invalide ou > 1 100 jours → `22023`, réponse validée par Zod. Appelée **deux fois** (période + période de comparaison).
- **Dates de référence** (bornes en heure de Paris, incluses) : devis créés = date d'émission (brouillons compris) ; acceptés / refusés = date de décision ; expirés = envoyés sans réponse dont la validité a pris fin pendant la période (et avant aujourd'hui) ; projets et tâches terminés = `completed_at` ; actions = `activity_logs`.
- **Taux d'acceptation** = acceptés ÷ (acceptés + refusés + expirés sans réponse) — choix validé (un devis resté sans réponse est un échec) ; « — » sans décision ; comparaison en points. **Panier moyen** = CA accepté HT ÷ nombre d'acceptés.
- **Périodes** (`?periode=`) : 30 derniers jours ; 3 mois = 13 semaines à partir d'un lundi ; 6 et 12 mois à partir du 1er du mois ; année en cours ; année précédente. Comparaison : période de même durée qui précède, ou mêmes dates de l'année précédente pour les années (29 février → 28 février).
- **Séries** complétées à zéro : par semaine (lundi) jusqu'à 92 jours, par mois au-delà. **État actuel** (tâches par statut / priorité, projets par statut) indépendant de la période. **Meilleurs clients** : 5 premiers par CA HT accepté.
- Variation affichée « Nouveau » quand la période de comparaison valait 0 (pas de pourcentage infini).
- `ModulePlaceholder` supprimé : toutes les pages de modules sont réelles.
