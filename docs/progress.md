# Avancement — Atelio

## État actuel

- **Phase 0 — Cadrage** : terminée (dépôt GitHub en attente, B-010).
- **Phase 1 — Initialisation** : terminée.
- **Phase 2 — Design global** : terminée.
- **Phase 3 — Authentification** : terminée.
- **Phase 4 — Base de données et espaces** : terminée.
- **Phase 5 — Clients** : terminée.
- **Phase 6 — Projets** : terminée.
- **Phase 7 — Tâches** : terminée. Ajout rapide, case « terminée » avec annulation, priorités, échéances et retards, filtres, panneau de modification, tâches sur la fiche projet.
- Base de dev : un seul compte, celui de l'utilisateur (avec ses propres données) ; aucun compte de test restant.
- GitHub : `memirkocak/Atelio`, push à la fin de chaque phase.

## Historique des sessions

### Session 1 — 13/11/2026

#### Tâche 1 — Cadrage
- Analyse complète du besoin, vérification des versions npm et de leur compatibilité.
- Décisions validées (DT-001 à DT-013) : Supabase cloud gratuit sans Docker (2 projets), Vercel Hobby, mode démo, TypeScript 6.0, ESLint 9…
- Git (branche `main`), `.gitignore`, `CLAUDE.md`, documents `/docs`. Commit `1e86811`.

#### Tâche 2 — Initialisation technique
- Projet généré avec `create-next-app@16.4.6` dans un dossier temporaire puis copié (pour préserver `CLAUDE.md`, `docs/`, `.gitignore`).
- Versions : Next 16.4.6, React 19.3.0, TypeScript 6.0.3, ESLint 9.39.5, Tailwind 4.3.3, shadcn 4.23 (Radix), Vitest 5.1.0, Playwright 1.65.1 (Chromium).
- `tsconfig.json` durci : `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`.
- `.gitattributes` (fins de ligne LF).
- Scripts npm : `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `test:e2e`.
- Vitest (`vitest.config.mts`, jsdom, Testing Library) + test de fumée sur `cn()`.
- Playwright (`playwright.config.ts`, locale fr-FR, fuseau Europe/Paris) + test de fumée de la page d'accueil.
- shadcn/ui : `components.json`, `src/components/ui/button.tsx`, `src/lib/utils.ts`, variables CSS ; couleur principale indigo provisoire.
- Page d'accueil provisoire « Atelio — En construction », `lang="fr"`, métadonnées.
- `.claude/launch.json` pour l'aperçu dans le navigateur intégré.
- Décisions DT-014 à DT-016 consignées.

**Vérifications (tâche 2)**
| Vérification | Résultat |
|---|---|
| `npm run typecheck` | ✅ 0 erreur |
| `npm run lint` | ✅ 0 erreur |
| `npm test` | ✅ 2/2 tests |
| `npm run build` | ✅ build de production réussi |
| `npm run test:e2e` | ✅ 1/1 test (Chromium) |
| Navigateur | ✅ page affichée (Geist, bouton indigo), aucune erreur console |
| `npm audit` | ⚠️ 7 vulnérabilités modérées, outils de dev uniquement (DT-016) |

**Problèmes / points ouverts**
- Dépôt GitHub à créer par l'utilisateur (B-010).
- `cacheComponents` activé par défaut : impact à valider lors de l'authentification (DT-015).
- ESLint 9 marqué « plus supporté » par npm mais requis par eslint-config-next (DT-004, DT-016).

#### Tâche 3 — Design global (phase 2)
- Tokens de design dans `globals.css` : neutres bleutés, fond `canvas`, indigo / bleu, 6 tonalités de statut, 5 couleurs de graphiques, rayon 8 px, texte 14 px, mode clair uniquement, `prefers-reduced-motion`.
- Composants shadcn ajoutés : sidebar, sheet, tooltip, separator, skeleton, input, breadcrumb, card, badge (libellés d'accessibilité traduits).
- Layout : `navigation.ts` (source unique), `AppShell`, `AppSidebar`, `AppTopbar`, `Brand`, `PageContainer`, `ModulePlaceholder` ; hook `useMediaQuery`.
- Composants partagés : `PageHeader`, `EmptyState`, `StatusBadge`.
- Pages : 8 modules sous `/w/[slug]/`, redirection `/w/<slug>` → tableau de bord, `not-found.tsx`, `error.tsx`, page d'accueil simple.
- Correctifs : composants qui lisent l'URL placés dans `<Suspense>` (exigé par cacheComponents au build) ; `use-mobile.ts` et `SidebarMenuSkeleton` corrigés pour les règles `react-hooks`.
- Décisions DT-017 et DT-018.

**Vérifications (tâche 3)**
| Vérification | Résultat |
|---|---|
| `npm run typecheck` | ✅ |
| `npm run lint` | ✅ (après correction de 2 erreurs dans du code shadcn généré) |
| `npm test` | ✅ 8/8 (navigation, StatusBadge, cn) |
| `npm run build` | ✅ (après mise en `<Suspense>` de la lecture d'URL) |
| `npm run test:e2e` | ✅ 7/7 : redirection, navigation des 8 modules + page active + titres, sidebar repliable, tablette repliée par défaut, menu mobile, accueil, 404 |
| Navigateur | ✅ 1440, 1024 et 375 px, pas de défilement horizontal, aucune erreur console |

### Session 2 — 14/11/2026

#### Tâche 4 — Authentification (phase 3)
- Projet Supabase de dev créé par l'utilisateur (« Atelio », eu-west-2) ; clés dans `.env.local` (format et accès vérifiés sans les afficher) ; CLI connectée et liée.
- Dépendances : `@supabase/supabase-js` 2.119, `@supabase/ssr` 0.12.7, `supabase` (CLI) 3.1.0, `react-hook-form`, `zod`, `@hookform/resolvers`, `server-only` ; composants shadcn `label`, `field`, `alert`, `dropdown-menu`, `avatar`.
- Code : `src/lib/env.ts`, `src/lib/supabase/{client,server,admin,proxy}.ts`, `src/proxy.ts`, `src/lib/auth/{session,redirect,routes,errors}.ts`, `src/lib/action-result.ts`, `src/lib/initials.ts`, `src/features/auth/` (schémas, actions, formulaires, menu du compte), pages `(auth)/…`, `/auth/confirm`, `/demarrage` ; boutons de la page d'accueil.
- Configuration Supabase : `supabase/config.toml` (4 réglages d'auth poussés après revue du diff), modèles d'e-mails français préparés mais non applicables sur le plan gratuit.
- Corrections : erreur `Date.now()` au pré-rendu (ajout de `connection()`), journalisation des mots de passe en dev désactivée, déconnexion du menu via formulaire.
- Décisions DT-019 à DT-021 ; DT-015 confirmée.

**Vérifications (tâche 4)**
| Vérification | Résultat |
|---|---|
| `npm run typecheck` / `lint` / `build` | ✅ |
| `npm test` | ✅ 33/33 (redirections sûres, routes, schémas, erreurs, initiales, navigation, StatusBadge) |
| `npm run test:e2e` | ✅ 15/15 dont inscription → déconnexion → connexion, mauvais mot de passe, retour à la page demandée, menu du compte, lien invalide, coquille connectée ; 27/27 sur deux passages |
| Navigateur | ✅ connexion / inscription / démarrage sur ordinateur et mobile, erreurs de validation en français, aucune erreur console |

**Points ouverts**
- Modèles d'e-mails français : nécessitent un SMTP personnalisé (B-036, phase 12).
- Projet de dev nommé « Atelio » et situé à Londres (pas d'impact).
- Dépôt GitHub toujours à créer (B-010).

#### Tâche 5 — Base de données et espaces de travail (phase 4)
- Migration `20261114065237_workspaces.sql` : tables, enum, triggers, schéma `private`, droits par colonne, RLS ; aperçu `--dry-run` puis application (`db push --remote`).
- Types générés `src/types/database.types.ts` ; clients Supabase typés ; scripts `db:push`, `db:types`, `test:rls`.
- Tests : `vitest.rls.config.mts`, `tests/rls/workspaces.test.ts`, utilitaires partagés `tests/support/supabase-test.ts` (nettoyage des comptes ET de leurs espaces).
- Application : `src/features/workspaces/` (requêtes, `WorkspaceGate`, `WorkspaceName`), `/demarrage` en Route Handler, redirections directes vers l'espace dans les actions d'auth, nom de l'espace dans la sidebar.
- Corrections : `connection()` déplacé dans le client serveur ; `id` des champs via `useId()` (doublons entre pages conservées par Next) ; sélecteurs E2E limités aux éléments visibles ; un serveur de dev orphelin arrêté.
- Décisions DT-022 et DT-023.

**Vérifications (tâche 5)**
| Vérification | Résultat |
|---|---|
| `npm run typecheck` / `lint` / `build` | ✅ |
| `npm test` | ✅ 33/33 |
| `npm run test:rls` | ✅ 18/18 : création auto, isolation A/B (liste, id, slug, membres), modifications interdites, colonnes protégées, contraintes, profils, membre simple, anonyme, fonctions privées |
| `npm run test:e2e` | ✅ 16/16, et 31/31 sur deux passages : inscription → arrivée dans « Espace de Alex », 404 sur l'espace d'un autre / inconnu, retour à la page demandée, coquille connectée |
| Navigateur | ✅ connexion → `/w/espace-de-camille-…/tableau-de-bord`, nom de l'espace et menu du compte corrects, aucune erreur console (captures impossibles : fenêtre masquée) |

**Points ouverts**
- Espaces orphelins après suppression d'un compte : à traiter avec la suppression de compte (B-045, phase 11).
- Dépôt GitHub toujours à créer (B-010).

#### Tâche 6 — Module Clients (phase 5)
- Migrations 0002 (`clients`, `activity_logs`, `pg_trgm`, `private.normalize_search`, `private.log_activity`) et 0003 (droits `service_role`), appliquées après `--dry-run` ; types régénérés.
- `src/features/clients/` : constantes, schémas (formulaire, URL, conversions), requêtes, actions, composants (formulaire, panneau, suppression, barre d'outils, liste, fiche, historique).
- Partagés : `src/lib/search.ts`, `src/lib/format.ts` (date-fns, fr), `src/lib/db-errors.ts`, `components/shared/pagination-nav.tsx`, `components/ui/toaster.tsx` ; `useServerActionForm`, `FormError`, `SubmitButton` déplacés dans `src/hooks` et `components/shared`.
- Dépendances : `sonner` ; composants shadcn `table`, `sheet`, `alert-dialog`, `textarea`, `select`.
- Bugs trouvés et corrigés : insert impossible par le client d'administration (migration 0003) ; boucle de redirection infinie pour une session sans espace ; téléphone commençant par « ( » refusé ; texte d'aide du formulaire inexact.
- Décisions DT-024 à DT-026.

**Vérifications (tâche 6)**
| Vérification | Résultat |
|---|---|
| `npm run typecheck` / `lint` / `build` | ✅ |
| `npm test` | ✅ 46/46 (dont 13 clients : recherche, schéma, URL) |
| `npm run test:rls` | ✅ 31/31 (dont 13 clients / journal) |
| `npm run test:e2e` | ✅ 25/25 (dont 8 clients + boucle de redirection) ; un passage interrompu par une mise en veille du PC, relancé sans erreur |
| Navigateur | ✅ liste (1440 px), fiche, liste en cartes et panneau (375 px), aucune erreur console |

#### Tâche 7 — Module Projets (phase 6)
- Migration 0004 (`projects`, clé étrangère composite, `completed_at`, journal) appliquée après `--dry-run` ; types régénérés.
- `src/features/projects/` (constantes, statut/retard, types partagés, schémas, requêtes, actions, composants : formulaire, panneau, tableau, Kanban, barre d'outils, fiche) ; `src/features/activity/` (journal partagé) ; `src/lib/money.ts`, `src/lib/dates.ts` ; composants partagés `ConfirmDeleteDialog`, `Panel`.
- Fiche client : projets du client, bouton « Nouveau projet » prérempli, avertissement « N projets seront détachés ».
- Dépendance : `@dnd-kit/core` 6.3.1 (prévue en DT-013).
- Problèmes rencontrés et corrigés : requête Supabase exécutée trop tôt (`await` sur le constructeur de requête) ; import d'un module `server-only` par le Kanban (types déplacés dans `types.ts`) ; suites E2E qui partageaient le même espace (isolation, DT-028) ; test terminé avant l'enregistrement serveur ; libellé de filtre vide avant hydratation.
- Décisions DT-027 et DT-028.

**Vérifications (tâche 7)**
| Vérification | Résultat |
|---|---|
| `npm run typecheck` / `lint` / `build` | ✅ |
| `npm test` | ✅ 76/76 (dont 30 projets / argent / dates) |
| `npm run test:rls` | ✅ 44/44 (dont 13 projets : isolation, client d'un autre espace refusé, `completed_at`, contraintes, détachement) |
| `npm run test:e2e` | ✅ 33/33 sur trois passages consécutifs (dont 8 projets : création, validation, glisser-déposer Kanban, menu de statut, filtres, fiche, détachement, suppression, mobile, 404) |
| Navigateur | ✅ tableau et Kanban (1440 px), Kanban défilant en mobile (375 px) |

#### Tâche 8 — Module Tâches (phase 7)
- Migration 0005 (`tasks`, clé étrangère composite vers `projects`, `completed_at`, journal) appliquée après `--dry-run` ; types régénérés.
- `src/features/tasks/` (constantes, types, retard et filtres d'échéance, schémas, requêtes, actions, composants : ajout rapide, case, ligne, liste, formulaire, panneau, barre d'outils, section) ; page `/w/[slug]/taches`.
- Fiche projet : section Tâches réelle ; confirmation de suppression du projet indiquant les tâches détachées.
- Aucune nouvelle dépendance. Décision DT-029.

**Vérifications (tâche 8)**
| Vérification | Résultat |
|---|---|
| `npm run typecheck` / `lint` / `build` | ✅ |
| `npm test` | ✅ 96/96 (dont 20 tâches : retard, semaine en heure de Paris, validation, URL) |
| `npm run test:rls` | ✅ 53/53 (dont 9 tâches) |
| `npm run test:e2e` | ✅ 41/41 sur deux passages consécutifs (dont 8 tâches : ajout rapide, cocher / annuler / rouvrir avec persistance, filtres, panneau, fiche projet, détachement, suppression, mobile, isolation) |
| Navigateur | ✅ liste (1280 px) et mobile (375 px) |

## Prochaine étape

**Phase 8 — Devis et PDF** : migration `quotes` / `quote_items` / numérotation (`DEV-AAAA-NNNN`), calculs HT / TVA / TTC dans une fonction Postgres qui fait foi (et le même calcul en TypeScript pour l'aperçu), instantané du client à l'envoi, statuts (brouillon, envoyé, accepté, refusé, expiré calculé), devis non modifiable hors brouillon, suppression d'un client bloquée s'il a des devis, génération du PDF (`@react-pdf/renderer`, police embarquée). C'est le module le plus sensible : à présenter en détail avant exécution.
