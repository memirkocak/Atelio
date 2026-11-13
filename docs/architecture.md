# Architecture technique — Atelio

_Dernière mise à jour : 13/11/2026 — statut : validée, non encore implémentée_

## 1. Stack

| Couche | Technologie | Version cible |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.4.x |
| UI | React | 19.3.x |
| Langage | TypeScript strict | 6.0.x |
| Style | Tailwind CSS (CSS-first) + shadcn/ui | 4.x / CLI 4.x |
| Icônes | lucide-react | 1.x |
| Formulaires | React Hook Form + Zod + @hookform/resolvers | 7.x / 4.x / 7.x |
| Dates | date-fns (locale `fr`) | 4.x |
| Graphiques | Recharts | 3.x |
| Tableaux | @tanstack/react-table (via DataTable shadcn) | 9.x |
| Kanban | @dnd-kit/core | 6.x |
| PDF | @react-pdf/renderer | 4.x |
| Notifications | sonner | 2.x |
| Backend | Supabase (PostgreSQL, Auth) — supabase-js, @supabase/ssr | 2.x / 0.12.x |
| Tests | Vitest, Playwright | 5.x / 1.x |
| Lint | ESLint + eslint-config-next | 9.x / 16.x |
| Hébergement | Vercel (Hobby) | — |

Versions vérifiées sur npm le 13/11/2026. Voir `decisions-techniques.md` pour TS 6.0 et ESLint 9.

## 2. Infrastructure

```
            ┌──────────────── Vercel (Hobby) ────────────────┐
Navigateur ─┤ Next.js : Server Components, Server Actions,    │
            │ Route Handlers (PDF), proxy.ts, Cron quotidien  │
            └───────────────┬────────────────────────────────┘
                            │ JWT utilisateur (RLS appliquée)
              ┌─────────────┴─────────────┐
              │ Supabase atelio-prod      │   Supabase atelio-dev
              │ Postgres + Auth + RLS     │   (développement, tests RLS)
              └───────────────────────────┘
```

- **Deux projets Supabase gratuits** : `atelio-dev` et `atelio-prod`. Pas de Docker.
- Migrations écrites dans `supabase/migrations/`, appliquées avec `npx supabase db push` (dev d'abord, prod ensuite).
- Types TypeScript générés : `npx supabase gen types typescript --linked > src/types/database.types.ts`.
- **Cron Vercel quotidien** : requête légère (maintien actif du projet Supabase gratuit) + réinitialisation des données du compte démo.

## 3. Principes applicatifs

1. **Server Components par défaut** pour les lectures, via le client Supabase serveur (cookies + JWT de l'utilisateur) : la RLS s'applique toujours.
2. **Server Actions pour les écritures** : `schéma Zod → getClaims() → contrôle d'appartenance à l'espace → requête Supabase → revalidatePath`. Retour typé `ActionResult<T>` (succès / erreurs de champ / erreur générale).
3. **Le navigateur n'écrit jamais directement en base.** Le client Supabase navigateur sert uniquement à l'authentification côté client si nécessaire.
4. **`proxy.ts`** : rafraîchit la session Supabase et redirige les routes protégées. La vérification d'autorisation réelle reste côté serveur (layouts, actions) et en base (RLS).
5. **Opérations atomiques en SQL (RPC)** : création / mise à jour d'un devis (lignes + totaux + numéro) dans une fonction Postgres. Le calcul TypeScript (`features/quotes/calculations.ts`) sert à l'aperçu en direct ; le serveur fait foi. Mêmes cas de test pour les deux.
6. **Journal d'activité par triggers Postgres** sur les tables métier.
7. **Espace actif dans l'URL** : `/w/[slug]/…`. Le layout vérifie l'appartenance à chaque requête.
8. **Clé secrète** uniquement dans `src/lib/supabase/admin.ts` (`import "server-only"`), pour seed et reset démo.

## 4. Arborescence

```
atelio/
├─ CLAUDE.md
├─ docs/
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/              # 0001_…sql, 0002_…sql
│  ├─ seed.sql                 # données de démo (marquées comme telles)
│  └─ tests/                   # tests RLS
├─ src/
│  ├─ app/
│  │  ├─ (marketing)/page.tsx                # accueil public + « Essayer la démo »
│  │  ├─ (auth)/connexion/ inscription/ mot-de-passe-oublie/ reinitialiser/
│  │  ├─ auth/callback/route.ts
│  │  ├─ api/cron/route.ts                   # keep-alive + reset démo (protégé par secret)
│  │  ├─ w/[slug]/
│  │  │  ├─ layout.tsx                       # sidebar + contrôle d'appartenance
│  │  │  ├─ tableau-de-bord/ clients/ projets/ taches/
│  │  │  ├─ devis/ devis/[id]/pdf/route.ts
│  │  │  ├─ calendrier/ statistiques/ parametres/
│  │  ├─ layout.tsx  globals.css  error.tsx  not-found.tsx
│  ├─ components/
│  │  ├─ ui/                   # shadcn
│  │  ├─ layout/               # Sidebar, Topbar, PageHeader, EmptyState, DemoBanner
│  │  └─ shared/               # DataTable, StatusBadge, MoneyInput, DatePicker…
│  ├─ features/
│  │  ├─ auth/ workspaces/ dashboard/ clients/ projects/ tasks/
│  │  ├─ quotes/ (calculations.ts, pdf/) calendar/ stats/ settings/
│  │  └─ <module>/ components/ actions.ts queries.ts schemas.ts types.ts
│  ├─ hooks/                   # use-media-query, use-mobile
│  ├─ lib/
│  │  ├─ supabase/ server.ts client.ts proxy.ts admin.ts
│  │  ├─ utils/ money.ts dates.ts format.ts cn.ts
│  │  ├─ action-result.ts  errors.ts
│  ├─ types/database.types.ts  # généré
│  └─ proxy.ts
├─ tests/ unit/ e2e/
└─ .env.example
```

## 5. Modèle de données

Toutes les tables métier ont `id uuid`, `workspace_id uuid not null`, `created_at`, `updated_at` (trigger), `created_by`.

| Table | Colonnes principales | Notes |
|---|---|---|
| `profiles` | `id` (= auth.users.id), `full_name`, `avatar_url` | Créé par trigger à l'inscription |
| `workspaces` | `name`, `slug` (unique), coordonnées entreprise, `default_vat_rate_bp`, `timezone`, `is_demo` | Créé automatiquement à l'inscription |
| `workspace_members` | `workspace_id`, `user_id`, `role` (`owner`/`admin`/`member`) | PK composite |
| `clients` | `contact_name`, `company`, `email`, `phone`, `address`, `notes` | |
| `projects` | `client_id?`, `name`, `description`, `status`, `budget_cents`, `start_date`, `due_date`, `progress` (0–100) | `CHECK due_date >= start_date` |
| `tasks` | `project_id?`, `title`, `description`, `status`, `priority`, `due_date`, `completed_at` | |
| `quotes` | `client_id`, `number`, `status`, `issue_date`, `valid_until`, `client_snapshot jsonb`, `subtotal_cents`, `vat_cents`, `total_cents`, `notes`, `sent_at`, `accepted_at` | `UNIQUE (workspace_id, number)` |
| `quote_items` | `quote_id`, `position`, `label`, `description`, `quantity` (numeric), `unit_price_cents`, `vat_rate_bp`, `line_subtotal_cents`, `line_vat_cents`, `line_total_cents` | |
| `quote_counters` | `workspace_id`, `year`, `last_value` | Numérotation, verrou de ligne |
| `events` | `title`, `description`, `starts_at`, `ends_at`, `all_day`, `client_id?`, `project_id?` | `timestamptz` |
| `activity_logs` | `actor_id`, `entity_type`, `entity_id`, `action`, `metadata jsonb` | Alimentée par triggers |

**Enums** : `project_status` (`upcoming`, `in_progress`, `on_hold`, `completed`, `cancelled`), `task_status` (`todo`, `in_progress`, `done`), `task_priority` (`low`, `medium`, `high`, `urgent`), `quote_status` (`draft`, `sent`, `accepted`, `refused`) — « expiré » est dérivé, `workspace_role`.

**Suppressions** : client avec devis → bloqué (`RESTRICT`) ; projet supprimé → tâches détachées (`SET NULL`) ; devis supprimé → lignes supprimées (`CASCADE`, brouillon uniquement).

**Montants** : `bigint` en centimes ; TVA en points de base (2000 = 20 %) ; arrondi au centime par ligne.

## 6. Sécurité

- RLS activée sur toutes les tables ci-dessus.
- Fonctions `is_workspace_member(ws uuid)` et `has_workspace_role(ws uuid, roles workspace_role[])` en `SECURITY DEFINER STABLE` avec `search_path` fixé, pour éviter la récursion RLS sur `workspace_members`.
- Politiques séparées `select` / `insert` / `update` / `delete` ; `workspace_id` vérifié à l'insertion (`WITH CHECK`).
- Devis : `update` des lignes interdit hors brouillon (politique + vérification dans la fonction RPC).
- Route cron protégée par un secret (`CRON_SECRET`).
- Variables : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publiques) ; `SUPABASE_SECRET_KEY`, `CRON_SECRET` (serveur uniquement).

## 7. Stratégie de tests

| Niveau | Outil | Cible |
|---|---|---|
| Unitaire | Vitest | calculs de devis, schémas Zod, utilitaires (argent, dates) |
| Sécurité | Vitest + Supabase dev | RLS : deux utilisateurs, deux espaces, aucune fuite |
| End-to-end | Playwright | inscription/connexion, CRUD par module, devis + PDF, mode démo |
| Statique | `tsc --noEmit`, ESLint | à chaque tâche |
