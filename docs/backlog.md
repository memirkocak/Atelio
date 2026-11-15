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
| B-045 | Suppression de compte : nettoyer les espaces dont l'utilisateur est seul propriétaire | ✅ (12a, migration 0010) |

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
| B-057 | Fiche client : lister les projets (✅ phase 6) et les devis (✅ phase 8) du client | ✅ |

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

## Phase 8 — Devis et PDF

| ID | Tâche | Statut |
|---|---|---|
| B-080 | Migration 0006 : `quotes`, `quote_items`, `quote_counters`, informations d'entreprise, fonctions `save_quote` / `set_quote_status` / `duplicate_quote` | ✅ |
| B-081 | Calcul TypeScript (`BigInt`) + cas de référence partagés avec la base | ✅ |
| B-082 | Tests base / sécurité (30) : calculs, numérotation concurrente, cycle de vie, instantanés, isolation | ✅ |
| B-083 | Paramètres : informations de l'entreprise, franchise de TVA, valeurs par défaut des devis | ✅ |
| B-084 | Liste, éditeur (totaux en direct), fiche avec aperçu et actions | ✅ |
| B-085 | PDF (`@react-pdf/renderer`), vérifié caractère par caractère | ✅ |
| B-086 | Fiche client : liste des devis, suppression bloquée annoncée | ✅ |
| B-087 | Tests E2E (10) ; configuration Playwright adaptée au serveur de dev | ✅ |
| B-088 | Remises, catalogue de prestations, envoi par e-mail | ⏸️ V2 |
| B-089 | Transformer un devis accepté en facture | ⏸️ V2 |

## Phase 9 — Tableau de bord

| ID | Tâche | Statut |
|---|---|---|
| B-090 | Migration 0007 : fonction `get_dashboard_stats` (SECURITY INVOKER, jour de Paris, séries complétées à zéro) | ✅ |
| B-091 | 6 cartes d'indicateurs reliées aux listes filtrées (dont tâches en retard, CA suivi HT / TTC, pipeline) | ✅ |
| B-092 | Graphiques Recharts (shadcn `chart`) : CA accepté par mois (6 mois), tâches terminées par semaine (8 semaines), résumé accessible | ✅ |
| B-093 | Flux d'activité récente de l'espace (10 événements, lien si l'élément existe encore) | ✅ |
| B-094 | Tests : 11 unitaires, 11 RLS (valeurs exactes, fuseau, isolation), 5 E2E | ✅ |

## Phase 10 — Calendrier

| ID | Tâche | Statut |
|---|---|---|
| B-100 | Migration 0008 : `events`, clés composites client / projet, contraintes de dates, RLS, journal | ✅ |
| B-101 | Conversion heure de Paris ↔ UTC (changements d'heure), utilitaires de semaine | ✅ |
| B-102 | Couche métier : schémas (formulaire, URL), grille, requêtes agrégées, actions | ✅ |
| B-103 | Vue mois (grille / mobile), vue semaine agenda, navigation, filtres par type | ✅ |
| B-104 | Panneau rendez-vous : horaire ou journée entière, lieu, client, projet, suppression | ✅ |
| B-105 | Tests : 22 unitaires, 9 RLS, 8 E2E | ✅ |
| B-106 | Glisser-déposer, rendez-vous récurrents, invitations | ⏸️ V2 |

## Phase 11 — Statistiques

| ID | Tâche | Statut |
|---|---|---|
| B-110 | Migration 0009 : fonction `get_statistics` (période, séries, état actuel, meilleurs clients) | ✅ |
| B-111 | Périodes et comparaison, taux d'acceptation (expirés inclus), panier moyen, variations | ✅ |
| B-112 | Page : sélecteur de période (URL), 8 indicateurs, 3 graphiques temporels, 3 répartitions, meilleurs clients | ✅ |
| B-113 | Tests : 13 unitaires, 12 RLS, 5 E2E | ✅ |
| B-114 | Export CSV, période personnalisée | ⏸️ V2 |

## Phase 12a — Finitions

| ID | Tâche | Statut |
|---|---|---|
| B-120 | Page Mon compte : nom affiché, changement de mot de passe | ✅ |
| B-121 | Suppression du compte (migration 0010, confirmation par mot de passe) | ✅ |
| B-122 | Accessibilité WCAG 2.1 AA (axe-core sur 19 pages), lien d'évitement | ✅ |
| B-123 | Tableau de bord mobile sur 2 colonnes | ✅ |
| B-124 | Tests : 6 unitaires, 4 RLS, 6 E2E compte + 19 accessibilité | ✅ |
| B-125 | Changement d'adresse e-mail | ⏸️ après SMTP (12f) |

## Phase 12b — Mode démo

| ID | Tâche | Statut |
|---|---|---|
| B-130 | Connexion anonyme (config) et espace de démo rempli à la création (migrations 0011, 0012) | ✅ |
| B-131 | Bouton « Essayer la démo », bandeau permanent, protections du compte de démo | ✅ |
| B-132 | Route `/api/cron` (purge 24 h, maintien actif) et `vercel.json` | ✅ |
| B-133 | Tests : 3 unitaires, 10 RLS, 8 E2E | ✅ |
| B-134 | Conversion d'une session de démo en vrai compte (conserver les données) | ⏸️ V2 |

## Phase 12c — Projet de production

| ID | Tâche | Statut |
|---|---|---|
| B-140 | Projet `atelio-prod` (Paris) créé par l'utilisateur | ✅ |
| B-141 | Migrations 0001 à 0012 appliquées en prod (aperçu puis application) | ✅ |
| B-142 | Configuration auth de la prod (`[remotes.production]`, option A sans confirmation e-mail) | ✅ |
| B-143 | Contrôles réels (RLS sans session, démo, protections) avec la clé publique | ✅ |
| B-144 | `site_url` / redirections de la prod vers l'URL Vercel | ✅ (12d) |
| B-145 | Confirmation par e-mail en prod (SMTP + domaine) | ⏸️ 12f |

## Phase 12d — Déploiement

| ID | Tâche | Statut |
|---|---|---|
| B-150 | Région Paris (`cdg1`) et en-têtes de sécurité | ✅ |
| B-151 | Projet Vercel `atelio-inoe` et variables de production (par l'utilisateur) | ✅ |
| B-152 | `site_url` / redirections de la prod | ✅ |
| B-153 | Vérifications en ligne (démo, modules, PDF, en-têtes, cron) | ✅ |
| B-154 | Test manuel d'inscription en production | ⏳ utilisateur |
| B-155 | Content-Security-Policy complète (nonces) | ⏸️ V2 |

## Phases suivantes (à détailler au moment venu)

- Phase 12 — Finalisation : paramètres, mode démo (seed, bandeau, reset nocturne), cron keep-alive, SMTP Resend (optionnel), déploiement Vercel, README portfolio
