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
