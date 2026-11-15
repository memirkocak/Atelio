# Avancement — Atelio

## État actuel

- **Phase 0 — Cadrage** : terminée.
- **Phase 1 — Initialisation** : terminée.
- **Phase 2 — Design global** : terminée.
- **Phase 3 — Authentification** : terminée.
- **Phase 4 — Base de données et espaces** : terminée.
- **Phase 5 — Clients** : terminée.
- **Phase 6 — Projets** : terminée.
- **Phase 7 — Tâches** : terminée.
- **Phase 8 — Devis et PDF** : terminée. Paramètres de l'entreprise, éditeur avec totaux en direct, calculs et numérotation garantis par la base, envoi figé, accepté / refusé / expiré, duplication, PDF, devis sur la fiche client.
- **Phase 9 — Tableau de bord** : terminée. 6 indicateurs réels reliés aux listes filtrées, CA accepté par mois et tâches terminées par semaine (Recharts), activité récente de l'espace.
- **Phase 10 — Calendrier** : terminée. Rendez-vous (horaire ou journée entière, lieu, client, projet), vues mois et semaine (agenda), échéances des tâches, projets et devis envoyés, filtres par type.
- **Phase 11 — Statistiques** : terminée. Indicateurs d'une période (CA, taux d'acceptation, panier moyen, devis, projets, tâches, actions) comparés à la période précédente, graphiques, meilleurs clients, état actuel des tâches et projets.
- **Phase 12 — Finalisation** : en cours. 12a (finitions), 12b (mode démo), 12c (projet de production) et 12d (déploiement : https://atelio-inoe.vercel.app) terminées ; restent 12e README, 12f e-mails (optionnel).
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

#### Tâche 9a — Devis : base de données et calculs (phase 8, partie a)
- Migration 0006 (`quotes`, `quote_items`, `quote_counters`, informations d'entreprise sur `workspaces`, fonctions `save_quote` / `set_quote_status` / `duplicate_quote`, journal) appliquée après `--dry-run`.
- `src/features/quotes/calculations.ts` + cas de référence partagés `tests/fixtures/quote-calculations.json`.
- Tests : 12 unitaires (calcul), 30 tests base / sécurité (`tests/rls/quotes.test.ts`). Cible TypeScript ES2022. Décision DT-030.
- Vérifications : typecheck, lint, build ✅ ; unitaires 108/108 ; RLS 83/83 ; E2E 41/41 (aucune régression).

#### Tâche 9b — Devis : écrans et PDF (phase 8, partie b)
- Paramètres de l'espace et de l'entreprise (`features/workspaces` : schéma, action, formulaire ; page `/parametres`).
- `src/features/quotes/` : constantes, statut affiché, types, schémas (éditeur, URL, conversions), coordonnées du document, récapitulatif TVA, requêtes, actions, composants (éditeur, aperçu, actions, liste, barre d'outils, badge), PDF (`pdf/quote-pdf.tsx`) ; pages liste / nouveau / fiche / modifier et Route Handler PDF.
- Fiche client : devis du client ; avertissement de suppression.
- Dépendance : `@react-pdf/renderer` 4.9.0 (prévue en DT-009).
- Problèmes rencontrés et corrigés : `runtime` interdit avec `cacheComponents` ; césure anglaise dans le PDF ; écart d'hydratation du Kanban (`DndContext` sans `id`) ; faux échecs E2E sous charge (configuration Playwright).
- Décision DT-031.

**Vérifications (tâche 9b)**
| Vérification | Résultat |
|---|---|
| `npm run typecheck` / `lint` / `build` | ✅ |
| `npm test` | ✅ 108/108 |
| `npm run test:rls` | ✅ 83/83 |
| `npm run test:e2e` | ✅ 51/51 sur deux passages consécutifs (dont 10 devis : paramètres, création avec totaux 1 630,00 € attendus, modification, envoi figé, PDF `%PDF-`, acceptation, duplication, expiré, client protégé, suppression, mobile, isolation page + PDF) |
| PDF | ✅ contenu extrait et vérifié (montants, mentions, caractères €, ’, —, « ») ; rendu visuel non affichable dans l'outil (à contrôler par l'utilisateur) |
| Navigateur | ✅ fiche et aperçu (1440 px), éditeur mobile (375 px, sans débordement) |

### Session 3 — 14/11/2026

#### Tâche 10 — Tableau de bord (phase 9)
- Migration 0007 `get_dashboard_stats` (SECURITY INVOKER, contrôle d'appartenance, jour / mois / semaines de Paris, séries complétées à zéro) ; aperçu `--dry-run` puis application ; types régénérés.
- `src/features/dashboard/` : schéma Zod de la réponse, séries et libellés, requêtes (indicateurs, activité récente avec existence des éléments), composants (cartes d'indicateurs, graphiques, flux d'activité, squelette) ; page `/w/[slug]/tableau-de-bord`.
- Choix validé : CA suivi rattaché au mois d'**acceptation** du devis.
- Dépendance : `recharts` 3.8.0 via `shadcn add chart` (`globals.css` inchangé).
- Flux d'activité : « Devis envoyé / accepté / refusé » reconnus à partir des colonnes modifiées (au lieu de « Devis modifié · coordonnées client… »).
- Problèmes rencontrés : insertion groupée supabase-js (colonnes absentes envoyées à NULL) et 404 en streaming (statut 200) dans le test E2E ; un faux échec E2E des devis sous charge (bouton encore en cours d'envoi), passé au relancement seul puis sur la suite complète.
- Décision DT-032.

**Vérifications (tâche 10)**
| Vérification | Résultat |
|---|---|
| `npm run typecheck` / `lint` / `build` | ✅ |
| `npm test` | ✅ 119/119 (dont 11 tableau de bord : schéma, séries, libellés d'activité) |
| `npm run test:rls` | ✅ 94/94 (dont 11 tableau de bord : valeurs exactes, fuseau de Paris au 1er du mois, isolation, anonyme refusé) |
| `npm run test:e2e` | ✅ 56/56 sur la suite complète (dont 5 tableau de bord : état vide, valeurs après rechargement, liens filtrés, élément supprimé sans lien, mobile, autre espace introuvable) ; 1er passage : 1 faux échec devis sous charge |
| Navigateur | ✅ compte temporaire avec données : valeurs conformes au jeu de données (CA 9 450 € HT / 11 340 € TTC, mois, pipeline, semaines), 1440 px et 375 px sans débordement, aucune erreur console ; compte supprimé |

**Points ouverts**
- Mobile : les 6 cartes sont empilées sur une colonne (lisible mais long) ; possible passage à 2 colonnes lors de la finition (phase 12).
- Les tâches n'ont pas de page de détail : pas de lien dans le flux d'activité.

#### Tâche 11 — Calendrier (phase 10)
- Migration 0008 `events` (clés composites vers `clients` et `projects` avec détachement, fin exclusive strictement après le début, durée max. 1 an, droits par colonne, RLS, journal `event`) ; aperçu `--dry-run` puis application ; types régénérés.
- `src/lib/dates.ts` : conversion heure de Paris ↔ UTC sans dépendance (`Intl`, changements d'heure gérés), `addDaysIso` (déplacé depuis les tâches), `isoWeekday`, `startOfWeekIso`.
- `src/features/calendar/` : constantes, types, schémas (formulaire, conversions, URL `view` / `date` / `hide`), grille (période, titres, répartition par jour), requêtes (rendez-vous chevauchant la période, tâches, projets, devis envoyés), actions, composants (barre d'outils en liens, calendrier interactif, élément, panneau, formulaire) ; page `/w/[slug]/calendrier`.
- Vue semaine de type agenda (choix validé) ; vue mois en grille sur ordinateur, mini-grille + liste des jours sur mobile.
- Activité récente du tableau de bord : « Rendez-vous créé / modifié / supprimé ».
- Composant shadcn `switch` (aucun nouveau paquet npm). Aucune nouvelle dépendance.
- Corrections après contrôle visuel : majuscule de tout le titre (`capitalize` → première lettre), horaire affiché deux fois en vue semaine, colonnes trop étroites (7 colonnes à partir de `lg`).
- Décision DT-033.

**Vérifications (tâche 11)**
| Vérification | Résultat |
|---|---|
| `npm run typecheck` / `lint` / `build` | ✅ |
| `npm test` | ✅ 141/141 (dont 8 dates / fuseau aux changements d'heure, 14 calendrier) |
| `npm run test:rls` | ✅ 103/103 (dont 9 rendez-vous : droits, contraintes, colonnes protégées, client / projet d'un autre espace, isolation, anonyme, détachement, journal) |
| `npm run test:e2e` | ✅ 63/63 sur la suite complète, premier passage (dont 8 calendrier : navigation, création avec heure de Paris vérifiée en base, journée entière sur 3 jours, validation, modification, suppression, tâches / projets / devis liés, filtres, mobile, isolation) |
| Navigateur | ✅ vues mois et semaine, panneau de modification (heures de Paris correctes), mobile 375 px sans débordement, aucune erreur console ; compte temporaire supprimé |

**Points ouverts**
- Pas de glisser-déposer ni de rendez-vous récurrents (V2).
- Les tâches et rendez-vous n'ont pas de page de détail : la tâche mène à la liste filtrée, le rendez-vous s'ouvre dans le panneau.

#### Tâche 12 — Statistiques (phase 11)
- Migration 0009 `get_statistics(workspace_id, du, au)` (SECURITY INVOKER, contrôle d'appartenance, bornes en heure de Paris, période ≤ 3 ans, séries par semaine jusqu'à 92 jours puis par mois, état actuel, 5 meilleurs clients) ; aperçu `--dry-run` puis application ; types régénérés.
- `src/features/stats/` : périodes (30 jours, 3 / 6 / 12 mois, année en cours, année précédente) et périodes de comparaison, variations, taux d'acceptation, panier moyen, schéma Zod, séries et répartitions, requêtes, composants (sélecteur de période, indicateurs, graphiques, meilleurs clients) ; page `/w/[slug]/statistiques`.
- Choix validés : taux d'acceptation = acceptés ÷ (acceptés + refusés + expirés sans réponse) ; comparaison avec la période précédente.
- `ModulePlaceholder` supprimé (plus aucune page en attente). Aucune nouvelle dépendance.
- Décision DT-034.

**Vérifications (tâche 12)**
| Vérification | Résultat |
|---|---|
| `npm run typecheck` / `lint` / `build` | ✅ (après correction d'un type dans un test RLS) |
| `npm test` | ✅ 154/154 (dont 13 statistiques : périodes, 29 février, variations, taux, panier, libellés) |
| `npm run test:rls` | ✅ 115/115 (dont 12 statistiques : valeurs exactes, 31 décembre 23 h 30 / 1er janvier 00 h 30 à Paris, semaines, période vide ou invalide, isolation, anonyme) |
| `npm run test:e2e` | ✅ 68/68 sur la suite complète, premier passage (dont 5 statistiques : état vide, valeurs après rechargement, meilleurs clients, changement de période, mobile, isolation) |
| Navigateur | ✅ 12 mois et 3 mois (semaines), ordinateur et mobile sans débordement, aucune erreur console ; compte temporaire supprimé |

**Points ouverts**
- Pas de période personnalisée ni d'export CSV (V2, B-114).
- Les dates de fin des tâches et projets n'existent que depuis les migrations 0004 / 0005 : les éléments terminés avant (aucun en production) n'apparaissent pas dans les séries.

### Session 4 — 15/11/2026

#### Tâche 13 — Finitions (phase 12a)
- Migration 0010 `delete_my_account()` (SECURITY DEFINER sans paramètre : agit uniquement sur `auth.uid()` ; supprime les espaces dont l'utilisateur est le seul propriétaire puis le compte ; compte de démonstration refusé `AT010`) ; aperçu `--dry-run` puis application ; types régénérés. B-045 terminé.
- Page `/w/[slug]/compte` (« Mon compte », depuis le menu du compte) : nom affiché (métadonnées + profil, jeton rafraîchi), changement de mot de passe (mot de passe actuel vérifié), suppression du compte confirmée par le mot de passe puis retour à la connexion avec message.
- `src/lib/auth/verify-password.ts` : vérification du mot de passe par un client Supabase isolé (sans cookie), session de vérification révoquée aussitôt ; la clé secrète n'est jamais utilisée.
- Accessibilité (axe-core, WCAG 2.1 A / AA) sur 19 pages : graphiques masqués non focalisables (`accessibilityLayer={false}`, résumés texte conservés), nom accessible du menu du compte et du logo contenant le texte visible, liens dans le texte soulignés, lien d'évitement « Aller au contenu ».
- Tableau de bord mobile : cartes sur 2 colonnes.
- Dépendance de développement : `@axe-core/playwright` 4.14.0 (version exacte). Décision DT-035.

**Vérifications (tâche 13)**
| Vérification | Résultat |
|---|---|
| `npm run typecheck` / `lint` / `build` | ✅ |
| `npm test` | ✅ 160/160 (dont 6 compte) |
| `npm run test:rls` | ✅ 119/119 (dont 4 suppression de compte : anonyme, démo refusée, cascade complète sans toucher aux autres, connexion impossible) |
| `npm run test:e2e` | ✅ 92/92 sur la suite complète (dont 6 compte et 19 accessibilité) ; deux passages précédents perturbés par le passage de minuit pendant l'exécution et par une attente manquante dans un test (corrigée) |
| Navigateur | ✅ Mon compte, tableau de bord mobile 2 colonnes, aucune erreur console ; compte temporaire supprimé |

**Points ouverts**
- Changement d'adresse e-mail : nécessite l'envoi d'e-mails (SMTP, 12f).
- Les tests E2E qui dépendent de « aujourd'hui » peuvent échouer s'ils s'exécutent à cheval sur minuit (heure de Paris) — sans incidence sur l'application.

#### Tâche 14 — Mode démo (phase 12b)
- Choix validé : **bac à sable par visiteur** (option B) plutôt qu'un compte partagé : « Essayer la démo » ouvre une session anonyme Supabase avec son propre espace pré-rempli, supprimé après 24 h.
- Configuration : connexion anonyme activée sur le projet de dev (`config diff` relu : un seul changement, puis `config push`).
- Migration 0011 : `private.seed_demo_workspace` (Studio Lumen fictif : 8 clients, 7 projets, 22 tâches, 14 devis sur 12 mois, 8 rendez-vous, historique ; dates relatives à aujourd'hui ; montants via `private.quote_line_amounts` ; domaines `.example`, aucun SIRET), déclenchée par la création d'un compte anonyme ; `public.purge_demo_accounts(âge)` réservée à `service_role`.
- Migration 0012 (correctif) : `null` non typé dans le journal (42804) qui faisait échouer la création de session ; trouvé avec `supabase db lint`. La 0011 déjà appliquée n'a pas été modifiée.
- Application : bouton « Essayer la démo » (accueil et connexion), bandeau permanent collant « Mode démo » avec « Créer un compte », menu « Session de démonstration », page Mon compte sans mot de passe ni suppression (actions refusées aussi côté serveur), nom de l'espace de démo non modifiable.
- Route `/api/cron` (GET, `Authorization: Bearer CRON_SECRET`, comparaison à temps constant) : purge des démos de plus de 24 h ; `vercel.json` (tous les jours à 3 h UTC) ; `CRON_SECRET` ajouté à `.env.example`.
- Aucune nouvelle dépendance. Décision DT-036 (DT-002 mise à jour).

**Vérifications (tâche 14)**
| Vérification | Résultat |
|---|---|
| `npm run typecheck` / `lint` / `build` | ✅ |
| `npm test` | ✅ 163/163 (dont 3 autorisation cron) |
| `npm run test:rls` | ✅ 129/129 (dont 10 démo : remplissage, cohérence des montants au centime, tableau de bord, isolation entre visiteurs, compte réel non touché, suppression et sortie du mode démo refusées, purge réservée au serveur et ciblée) |
| `npm run test:e2e` | ✅ 98/98 sur la suite complète ; démo relancée après le bandeau collant : 8/8 dont accessibilité ; route cron avec `CRON_SECRET` (ajouté par l'utilisateur dans `.env.local`) : 401 sans secret ou avec un mauvais secret, 200 avec le bon |
| Navigateur | ✅ accueil → démo en un clic, tableau de bord rempli, bandeau visible au défilement, aucune erreur console ; sessions de démo supprimées |

**Points ouverts**
- Le cron n'est actif qu'une fois déployé sur Vercel (12d) ; d'ici là, les sessions de démo locales ne sont pas purgées automatiquement.
- `db lint` signale deux variables inutilisées dans `seed_demo_workspace` (sans effet).

#### Tâche 15 — Projet de production (phase 12c)
- Projet `atelio-prod` créé par l'utilisateur (ref `klcrksxjyhydxtczqquh`, Paris `eu-west-3`, plan gratuit).
- CLI liée temporairement à la prod : `db push --dry-run` (12 migrations attendues) puis `db push` : migrations 0001 à 0012 appliquées sans erreur ; `migration list` aligné ; `db lint` : seulement les deux avertissements connus.
- Configuration : bloc `[remotes.production]` dans `supabase/config.toml` ; `config diff` relu (5 écarts attendus : confirmation par e-mail désactivée — option A —, connexion anonyme, mot de passe 8 caractères lettres + chiffres, redirections) puis `config push` ; diff final à zéro.
- Contrôles réels sur la prod avec la **clé publique** seulement (récupérée par la CLI, jamais affichée ; clé secrète non utilisée) : sans session tout est refusé (42501), session de démo créée en 214 ms avec l'espace rempli (8 clients, 3 tâches en retard, 7 devis acceptés), suppression du compte démo refusée (AT010), purge refusée aux visiteurs.
- CLI reliée au dev et vérifiée (projet « Atelio », 12 migrations alignées, config identique).
- `CLAUDE.md` : référence de la prod et procédure « appliquer en prod ». Décision DT-037.

**Vérifications (tâche 15)**
| Vérification | Résultat |
|---|---|
| Migrations prod | ✅ 12/12 appliquées, alignées avec le dépôt |
| `db lint` prod | ✅ aucune erreur (2 avertissements connus) |
| Config auth prod | ✅ diff à zéro après `config push` |
| RLS prod (sans session) | ✅ refus sur workspaces, clients, quotes, activity_logs, purge |
| Démo prod | ✅ session anonyme + espace rempli, protections actives |
| CLI | ✅ reliée au dev après l'opération |

**Points ouverts**
- `site_url` et redirections de la prod pointent encore vers `localhost` : à remplacer par l'URL Vercel en 12d.
- Une session de démo de contrôle existe en prod : elle sera purgée par le cron (actif après le déploiement 12d).
- Projet gratuit : mis en pause après 7 jours sans activité tant que le cron n'est pas déployé.

#### Tâche 16 — Déploiement Vercel (phase 12d)
- Code : `vercel.json` (fonctions en région Paris `cdg1`, au plus près de la base), en-têtes de sécurité dans `next.config.ts` (`X-Frame-Options`, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, sans `X-Powered-By`) + test E2E. Commit `6dc170b`.
- Vercel (par l'utilisateur) : projet `atelio-inoe` importé depuis GitHub, variables de production saisies dans Vercel (clés `atelio-prod`, `CRON_SECRET` propre à la prod, `NEXT_PUBLIC_SITE_URL`). Un second projet importé par erreur (`atelio-nine`, en erreur 500 faute de variables) a été supprimé.
- Supabase prod : `[remotes.production.auth]` (`site_url` et redirections vers `https://atelio-inoe.vercel.app`) ; `config diff` relu (2 écarts attendus) puis `config push` ; CLI reliée au dev ensuite. Commit `27a2a0b`.

**Vérifications (tâche 16)**
| Vérification | Résultat |
|---|---|
| Suite locale avant déploiement | ✅ typecheck, lint, 163 unitaires, build, 101/101 E2E (deux lenteurs sous charge au premier passage, passées à la relance) |
| Site en ligne | ✅ 200, servi depuis `cdg1` ; HSTS (Vercel) et en-têtes de sécurité présents |
| Accès | ✅ pages de l'espace redirigées vers `/connexion` sans session |
| Démo en ligne | ✅ espace « Studio Lumen » rempli, bandeau, tableau de bord, devis, calendrier, statistiques, aucune erreur console |
| PDF en ligne | ✅ `application/pdf`, signature `%PDF-` |
| Cron en ligne | ✅ 401 sans secret ; 200 avec le secret (test lancé par l'utilisateur depuis son terminal) |
| Doublon Vercel | ✅ `atelio-nine` supprimé (404) |

**Points ouverts**
- Inscription / connexion / suppression d'un vrai compte en production : test manuel confié à l'utilisateur (Claude ne crée pas de compte ni ne saisit de mot de passe sur un site en production).
- Les sessions de démo de contrôle (12c, 12d) seront purgées par le cron de la nuit.
- Le menu « Cron Jobs » n'était pas visible dans l'interface Vercel : le cron est déclaré dans `vercel.json` ; son exécution quotidienne sera visible dans les journaux du projet.

## Prochaine étape

**12e — README portfolio** : présentation du projet (lien vers le site et la démo), captures d'écran, stack et choix techniques (RLS, calculs SQL, fuseau, démo privée), architecture, tests, lancement en local. À présenter en détail avant exécution.
