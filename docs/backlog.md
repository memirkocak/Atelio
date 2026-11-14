# Backlog — Atelio

_Dernière mise à jour : 13/11/2026_

Statuts : ✅ fait · 🟡 en cours · ⚪ à faire · ⏸️ en attente (action utilisateur)

## Phase 0 — Cadrage

| ID | Tâche | Statut |
|---|---|---|
| B-001 | Initialiser Git (branche `main`) et `.gitignore` | ✅ |
| B-002 | Rédiger `CLAUDE.md` et les 6 documents de `/docs` | ✅ |
| B-010 | Créer le dépôt GitHub `atelio` (public, vide) — **par l'utilisateur** — puis ajouter le remote et pousser | ⏸️ |

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
| B-040 | Migration 0001 : profiles, workspaces, workspace_members, enum de rôles, triggers (`updated_at`, création profil + espace à l'inscription) | ⚪ |
| B-041 | Fonctions `is_workspace_member` / `has_workspace_role` + politiques RLS | ⚪ |
| B-042 | Génération des types TypeScript | ⚪ |
| B-043 | Tests RLS (deux utilisateurs, deux espaces) | ⚪ |
| B-044 | Layout `/w/[slug]` : contrôle d'appartenance, redirection vers l'espace par défaut | ⚪ |

## Phases suivantes (à détailler au moment venu)

- Phase 5 — Clients
- Phase 6 — Projets (tableau + Kanban)
- Phase 7 — Tâches
- Phase 8 — Devis & PDF
- Phase 9 — Tableau de bord
- Phase 10 — Calendrier
- Phase 11 — Statistiques
- Phase 12 — Finalisation : paramètres, mode démo (seed, bandeau, reset nocturne), cron keep-alive, SMTP Resend (optionnel), déploiement Vercel, README portfolio
