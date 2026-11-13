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
_13/11/2026 — à confirmer en phase 3_

- Le gabarit officiel `create-next-app@16.4.6` active `cacheComponents` et `partialPrefetching`, et utilise le loader `@tailwindcss/turbopack` (pas de PostCSS).
- **Décision** : conserver ces valeurs par défaut officielles.
- **Conséquence** : les pages lisant des données dynamiques (cookies de session Supabase) devront placer ces accès dans des frontières `<Suspense>` ; à valider avec la doc embarquée (`node_modules/next/dist/docs/`) lors de l'intégration de l'authentification. Si c'est trop contraignant, la désactivation sera discutée et consignée ici.
- `typecheck` exécute `next typegen` avant `tsc`, car les types globaux `LayoutProps` / `PageProps` sont générés.

### DT-016 — Vulnérabilités npm audit des outils de développement
_13/11/2026 — acceptée temporairement_

- `npm audit` signale 7 vulnérabilités modérées (`deepmerge` via la CLI shadcn, `minimatch` via typescript-eslint / ts-morph).
- Elles ne concernent que des **outils de développement**, jamais exécutés dans le navigateur ni en production. `npm audit fix --force` rétrograderait shadcn en 1.0.0 (cassant) : non appliqué.
- **Action** : revérifier à chaque mise à jour des dépendances.
- Note : ESLint 9 est signalé « plus supporté » par npm ; il reste requis par `eslint-config-next` 16.4 (DT-004). Passer à ESLint 10 dès que l'écosystème le permet.
