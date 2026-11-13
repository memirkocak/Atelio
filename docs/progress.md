# Avancement — Atelio

## État actuel

- **Phase 0 — Cadrage** : terminée (dépôt GitHub en attente, B-010).
- **Phase 1 — Initialisation** : terminée. L'application démarre ; `typecheck`, `lint`, tests unitaires, build et test E2E sont au vert.
- Aucune fonctionnalité métier, aucune connexion Supabase pour l'instant.

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

## Prochaine étape

**Phase 2 — Design global (B-020 à B-023)** : définir la palette et la typographie, construire le layout applicatif (sidebar, topbar, menu mobile), les composants partagés, les coquilles des pages des modules et la page d'accueil publique. À présenter en détail avant exécution.
