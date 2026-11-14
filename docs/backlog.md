# Backlog — Atelio

_Dernière mise à jour : 13/11/2026_

Statuts : ✅ fait · 🟡 en cours · ⚪ à faire · ⏸️ en attente (action utilisateur)

## Phase 0 — Cadrage

| ID | Tâche | Statut |
|---|---|---|
| B-001 | Initialiser Git (branche `main`) et `.gitignore` | ✅ |
| B-002 | Rédiger `CLAUDE.md` et les 6 documents de `/docs` | ✅ |
| B-010 | Dépôt GitHub `memirkocak/Atelio` créé et relié par l'utilisateur ; push à la fin de chaque phase | ✅ |

## Phase 1 — Initialisation

| ID | Tâche | Statut |
|---|---|---|
| B-003 | `create-next-app` (TS, App Router, `src/`, alias `@/`, Tailwind 4, ESLint) ; figer TypeScript 6.0.x et ESLint 9.x ; `strict` + options strictes supplémentaires | ✅ |
| B-004 | Scripts npm `dev`, `build`, `typecheck`, `lint`, `test`, `test:e2e` ; configurer Vitest et Playwright avec un test de fumée chacun | ✅ |
| B-005 | Initialiser shadcn/ui (Radix), couleur principale indigo provisoire, police Geist, page provisoire | ✅ |
| B-011 | Mettre à jour `CLAUDE.md` (section Commandes) et `docs/progress.md` | ✅ |

## Phase 2 — Design global

| ID | Tâche | Statut |
|---|---|---|
| B-019 | Tokens de design : palette, statuts, graphiques, rayon, densité | ✅ |
| B-020 | Layout applicatif : sidebar (navigation des modules), topbar, menu mobile | ✅ |
| B-021 | Composants partagés : PageHeader, EmptyState, StatusBadge, PageContainer | ✅ |
| B-022 | Pages vides des modules (coquilles) sous `/w/[slug]/…`, 404 et page d'erreur | ✅ |
| B-023 | Page d'accueil publique, version simple (boutons d'accès ajoutés en phases 3 et 12) | ✅ |

## Phase 3 — Authentification

| ID | Tâche | Statut |
|---|---|---|
| B-030 | Créer le projet Supabase de dev (« Atelio ») — par l'utilisateur. `atelio-prod` reporté en phase 12 | ✅ |
| B-031 | `.env.example`, `npx supabase init`, connexion et liaison de la CLI | ✅ |
| B-032 | Clients Supabase `server.ts`, `client.ts`, `proxy.ts`, `admin.ts` ; `src/proxy.ts` ; session serveur | ✅ |
| B-033 | Pages connexion, inscription, mot de passe oublié, réinitialisation ; `/auth/confirm` ; menu du compte ; `/demarrage` | ✅ |
| B-034 | Tests unitaires et E2E du parcours d'authentification | ✅ |
| B-035 | Configuration de l'auth en code (`config.toml` + `config push`) | ✅ |
| B-036 | Activer les modèles d'e-mails français avec un SMTP personnalisé (Resend) | ⏸️ phase 12 |

## Phase 4 — Base de données et espaces

| ID | Tâche | Statut |
|---|---|---|
| B-040 | Migration 0001 : profiles, workspaces, workspace_members, enum de rôles, triggers (`updated_at`, création profil + espace à l'inscription) | ✅ |
| B-041 | Fonctions `private.*` + politiques RLS + droits par colonne | ✅ |
| B-042 | Génération des types TypeScript (`npm run db:types`) | ✅ |
| B-043 | Tests RLS (deux utilisateurs, deux espaces) — `npm run test:rls` | ✅ |
| B-044 | Layout `/w/[slug]` : contrôle d'appartenance (404), redirection vers l'espace par défaut, nom de l'espace dans la sidebar | ✅ |
| B-045 | Suppression de compte : nettoyer les espaces dont l'utilisateur est seul propriétaire | ⏸️ phase 11 |

## Phase 5 — Clients

| ID | Tâche | Statut |
|---|---|---|
| B-050 | Migration 0002 : `clients`, `activity_logs`, recherche normalisée, RLS, droits par colonne | ✅ |
| B-051 | Migration 0003 : droits `service_role` sur `private.normalize_search` | ✅ |
| B-052 | Couche métier : schémas, requêtes, Server Actions | ✅ |
| B-053 | Liste : recherche, filtre, tri, pagination (URL), tableau / cartes mobiles, états vides | ✅ |
| B-054 | Panneau de création / modification, suppression confirmée, notifications | ✅ |
| B-055 | Fiche client : coordonnées, notes, historique, emplacements Projets / Devis | ✅ |
| B-056 | Tests : 13 unitaires, 13 RLS, 8 E2E (+ test de non-régression de la boucle de redirection) | ✅ |
| B-057 | Fiche client : lister les projets (✅ phase 6) et les devis (phase 8) du client | 🟡 |

## Phase 6 — Projets

| ID | Tâche | Statut |
|---|---|---|
| B-060 | Migration 0004 : `projects`, clé étrangère composite vers `clients`, `completed_at`, RLS, journal | ✅ |
| B-061 | Utilitaires argent (centimes) et dates (Paris) | ✅ |
| B-062 | Couche métier : schémas, requêtes, actions (dont changement de statut seul) | ✅ |
| B-063 | Liste tableau (recherche, statut, client, tri, pagination, retard, budget, avancement) | ✅ |
| B-064 | Vue Kanban : glisser-déposer (souris, toucher, clavier), mise à jour optimiste, menu de statut | ✅ |
| B-065 | Panneau de création / modification, suppression confirmée, fiche projet avec historique | ✅ |
| B-066 | Fiche client : liste des projets, création préremplie, avertissement à la suppression | ✅ |
| B-067 | Tests : 30 unitaires, 13 RLS, 8 E2E ; isolation des suites E2E | ✅ |
| B-068 | Fiche projet : liste des tâches (phase 7) | ✅ |

## Phase 7 — Tâches

| ID | Tâche | Statut |
|---|---|---|
| B-070 | Migration 0005 : `tasks`, clé étrangère composite vers `projects`, `completed_at`, RLS, journal | ✅ |
| B-071 | Couche métier : schémas, filtres d'échéance (Paris), requêtes, actions (dont cocher / ajout rapide) | ✅ |
| B-072 | Liste : ajout rapide, case optimiste avec annulation, filtres, terminées masquées, compteurs | ✅ |
| B-073 | Panneau de création / modification / suppression | ✅ |
| B-074 | Fiche projet : tâches, compteur, ajout rapide ; avertissement à la suppression du projet | ✅ |
| B-075 | Tests : 20 unitaires, 9 RLS, 8 E2E | ✅ |
| B-076 | Personne assignée (avec la collaboration) | ⏸️ V2 |

## Phases suivantes (à détailler au moment venu)

- Phase 6 — Projets (tableau + Kanban)
- Phase 7 — Tâches
- Phase 8 — Devis & PDF
- Phase 9 — Tableau de bord
- Phase 10 — Calendrier
- Phase 11 — Statistiques
- Phase 12 — Finalisation : paramètres, mode démo (seed, bandeau, reset nocturne), cron keep-alive, SMTP Resend (optionnel), déploiement Vercel, README portfolio
