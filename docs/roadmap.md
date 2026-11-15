# Roadmap — Atelio

_Dernière mise à jour : 14/11/2026_

Chaque phase n'est terminée que lorsque ses critères sont vérifiés (typecheck, lint, tests, navigateur, cas d'erreur, permissions). Un module à la fois.

| # | Phase | Contenu | Critères de fin | Statut |
|---|---|---|---|---|
| 0 | Cadrage | Analyse, décisions, documentation, `CLAUDE.md`, Git | Docs cohérentes, dépôt initialisé | ✅ (GitHub en attente) |
| 1 | Initialisation | Next.js, TS 6.0 strict, Tailwind 4, shadcn, ESLint 9, Vitest, Playwright, scripts npm | `dev` démarre ; `build`, `typecheck`, `lint`, tests de fumée au vert | ✅ |
| 2 | Design global | Tokens (couleurs, typo), layout app (sidebar, topbar, en-têtes, états vides), page d'accueil, responsive | Coquille navigable sur ordinateur, tablette, mobile | ✅ |
| 3 | Authentification | Projets Supabase dev/prod, clients Supabase, `proxy.ts`, inscription, connexion, déconnexion, mot de passe oublié | Parcours complets testés (E2E) ; routes protégées | ✅ |
| 4 | Base & espaces | Migrations profiles / workspaces / members, triggers, fonctions RLS, création auto de l'espace, types générés | Tests RLS : aucune fuite entre deux espaces | ✅ |
| 5 | Clients | Migration, CRUD, recherche, filtres, fiche client | CRUD + RLS + E2E | ✅ |
| 6 | Projets | Migration, CRUD, statuts, budget, avancement, vue tableau + Kanban | CRUD + Kanban + RLS + E2E | ✅ |
| 7 | Tâches | Migration, CRUD, priorités, retards, filtres | CRUD + filtres + RLS + E2E | ✅ |
| 8 | Devis & PDF | Migration, RPC de calcul, numérotation, instantané, statuts, PDF | Tests de calcul (TS = SQL), PDF correct (accents, €), RLS + E2E | ✅ |
| 9 | Tableau de bord | KPI réels, graphiques, activité récente (activity_logs) | Valeurs vérifiées contre la base | ✅ |
| 10 | Calendrier | Événements (migration + CRUD), vues mois / semaine, agrégation tâches / projets / devis | Affichage correct, fuseau Europe/Paris | ✅ |
| 11 | Statistiques | Graphiques Recharts sur données réelles | Valeurs vérifiées | ✅ |
| 12 | Finalisation & mise en ligne | Paramètres, mode démo (seed + reset), cron Vercel, accessibilité, projet Supabase `atelio-prod` (Paris, confirmation e-mail activée), SMTP Resend + modèles d'e-mails français, déploiement prod, README portfolio | App en ligne, démo fonctionnelle, README avec captures | 🟡 12a ✅ 12b ✅ |

**Note** : le tableau de bord vient après les modules métier pour afficher de vraies données (une coquille vide existe dès la phase 2).

## V2 (hors périmètre actuel)

Invitations et collaboration, connexion Google, facturation, envoi des devis par e-mail, catalogue de prestations.
