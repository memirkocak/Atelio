# CLAUDE.md — Atelio

Atelio est une application SaaS de gestion d'activité (CRM, projets, tâches, devis, calendrier, statistiques) pour indépendants, freelances, TPE et agences. Interface entièrement en français.

Objectif : un projet réel, fonctionnel et sécurisé, déployé gratuitement (Vercel Hobby + Supabase Free) et présenté dans un portfolio LinkedIn. Les recruteurs doivent pouvoir l'essayer en un clic via le **mode démo**.

## Méthode de travail (obligatoire)

1. **Avant chaque tâche** : expliquer précisément ce qui va être fait (fichiers, commandes, choix, risques).
2. **Discussion** : l'utilisateur ajuste si besoin.
3. **Attendre un « go » explicite** avant de créer, installer, modifier ou committer quoi que ce soit. Un « go » ne vaut que pour la tâche présentée.
4. **Exécution**, un module à la fois.
5. **Bilan** : modifications, fichiers, vérifications et résultats, problèmes restants, prochaine étape.

Une tâche n'est terminée que si elle a été vérifiée : `typecheck`, `lint`, tests pertinents, affichage navigateur, cas d'erreur, permissions.

### Début de session
1. Lire ce fichier.
2. Lire `docs/progress.md`.
3. Consulter `docs/roadmap.md` et `docs/backlog.md`.
4. Examiner l'état du code (`git status`, `git log`).
5. Identifier la prochaine tâche prioritaire et la présenter avant de commencer.

### Fin de session
1. Résumer les modifications, lister les fichiers créés/modifiés.
2. Indiquer les tests effectués et leurs résultats.
3. Signaler les problèmes restants.
4. Mettre à jour `docs/progress.md` (et backlog / décisions si besoin).
5. Indiquer précisément la prochaine étape.

## Stack (versions figées)

| Outil | Version | Note |
|---|---|---|
| Next.js (App Router) | 16.4.x | `proxy.ts` remplace `middleware.ts` |
| React | 19.3.x | |
| TypeScript | **6.0.x** strict | Pas TS 7 : typescript-eslint exige `<6.1` |
| ESLint | **9.x** | Pas ESLint 10 : eslint-plugin-react/import incompatibles |
| Tailwind CSS | 4.x | Configuration CSS-first |
| shadcn/ui | CLI 4.x | Composants copiés dans `src/components/ui` |
| Supabase | supabase-js 2.x, @supabase/ssr 0.12.x, CLI via `npx supabase` | **Pas de Docker** |
| Zod / React Hook Form | 4.x / 7.x | |
| Recharts / date-fns / lucide-react | 3.x / 4.x / 1.x | |
| @react-pdf/renderer | 4.x | PDF des devis côté serveur |
| Vitest / Playwright | 5.x / 1.x | |

Gestionnaire de paquets : **npm**. N'ajouter aucune dépendance sans justification (à consigner dans `docs/decisions-techniques.md`).

## Infrastructure

- Supabase cloud, plan gratuit, **deux projets** : dev = « Atelio » (ref `sngvhoygizlvxwwqnsyi`, lié à la CLI ; développement + tests) et `atelio-prod` (production, créé en phase 12).
- Session : toujours lue dans une frontière `<Suspense>` via `requireUser()` / `getCurrentUser()` (`src/lib/auth/session.ts`), qui appellent `connection()` puis `getClaims()`.
- Toute modification du schéma passe par une migration SQL versionnée dans `supabase/migrations/`, appliquée d'abord sur dev, puis sur prod.
- Les secrets (mot de passe BDD, clés, tokens) sont saisis **par l'utilisateur** dans `.env.local` ou via `npx supabase login`. Ils ne transitent jamais par le chat et ne sont jamais committés.

## Conventions

- **Interface et routes en français** (`/w/[slug]/clients`, `/connexion`…). **Code en anglais** (variables, tables, types, fichiers).
- Organisation par domaine : `src/features/<module>/` (`components/`, `actions.ts`, `queries.ts`, `schemas.ts`, `constants.ts`). **Le module Clients est le modèle de référence** (DT-024) : le reproduire pour les modules suivants (migration + RLS + trigger de journal + tests RLS / unitaires / E2E).
- Server Components par défaut ; `"use client"` seulement si nécessaire.
- Écritures via **Server Actions** : validation Zod → contrôle de l'appartenance à l'espace → Supabase.
- Montants en **centimes** (`bigint`), taux de TVA en **points de base** (2000 = 20 %). Jamais de flottant pour l'argent.
- Échéances en `date`, rendez-vous en `timestamptz`, fuseau de référence `Europe/Paris`.
- Fichiers courts et ciblés ; pas de composant qui mélange UI et logique métier.

## Sécurité (non négociable)

- RLS activée sur **toutes** les tables contenant des données privées ; chaque donnée métier porte un `workspace_id`. Politiques basées sur `private.is_workspace_member()` / `private.has_workspace_role()` (schéma non exposé) ; droits d'écriture accordés colonne par colonne ; chaque nouvelle table a ses tests dans `tests/rls/`.
- Next.js 16 garde les pages visitées dans le DOM (masquées) : identifiants HTML via `useId()`, jamais en dur ; tests E2E via les helpers visibles de `tests/e2e/helpers/locators.ts`.
- Identité côté serveur via `supabase.auth.getClaims()`, jamais `getSession()`.
- La clé secrète Supabase n'est utilisée que dans `src/lib/supabase/admin.ts` (`server-only`) pour les scripts d'administration (seed, reset démo), jamais dans un flux utilisateur.
- Calculs des devis validés et recalculés côté serveur (fonction Postgres) ; devis non modifiable hors brouillon.
- Ne jamais contourner une protection, ne jamais présenter des données fictives comme réelles (le mode démo est signalé par un bandeau).

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement (http://localhost:3000) |
| `npm run build` | Build de production |
| `npm run typecheck` | `next typegen` puis `tsc --noEmit` (les types `LayoutProps`/`PageProps` sont générés par Next) |
| `npm run lint` | ESLint |
| `npm test` | Tests unitaires Vitest (`tests/unit`, `src/**/*.test.ts(x)`) |
| `npm run test:e2e` | Tests Playwright (`tests/e2e`, Chromium, démarre `npm run dev` automatiquement) |
| `npx shadcn@4.23.0 add <composant>` | Ajouter un composant shadcn/ui (base Radix) |
| `npx supabase config diff` / `config push` | Comparer puis appliquer `supabase/config.toml` au projet lié (toujours relire le diff avant) |
| `npx supabase migration new <nom>` | Créer une migration SQL dans `supabase/migrations/` |
| `npx supabase db push --remote --dry-run` puis `npm run db:push` | Aperçu puis application des migrations au projet lié |
| `npm run db:types` | Régénérer `src/types/database.types.ts` après chaque migration |
| `npm run test:rls` | Tests de sécurité RLS (projet de dev, deux utilisateurs réels) |

Les tests E2E utilisent le projet Supabase de dev (clés dans `.env.local`) et suppriment leurs comptes `e2e-…@example.com` à la fin.

Vérification complète avant de déclarer une tâche terminée : `npm run typecheck && npm run lint && npm test && npm run build`, puis `npm run test:e2e` et contrôle visuel.

## Next.js 16

Lire `AGENTS.md` : la version de Next.js utilisée a des changements importants. Consulter la doc embarquée dans `node_modules/next/dist/docs/` avant d'utiliser une API Next. `cacheComponents` est activé (voir DT-015).

## Documentation

- `docs/cahier-des-charges.md` — besoin fonctionnel
- `docs/architecture.md` — architecture technique et schéma de données
- `docs/roadmap.md` — phases de développement
- `docs/backlog.md` — tâches détaillées et statuts
- `docs/decisions-techniques.md` — journal des décisions (ADR)
- `docs/progress.md` — état d'avancement, à mettre à jour à chaque session

Ces documents doivent rester cohérents avec le code réel.
