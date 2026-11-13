# Avancement — Atelio

## État actuel

**Phase 0 — Cadrage : terminée côté local.** Aucun code applicatif. Aucune dépendance installée.

En attente : création du dépôt GitHub par l'utilisateur (B-010).

## Historique des sessions

### Session 1 — 13/11/2026

**Réalisé**
- Analyse complète du besoin, vérification des versions npm et de leur compatibilité.
- Décisions validées avec l'utilisateur (voir `decisions-techniques.md`, DT-001 à DT-013), notamment : Supabase cloud gratuit sans Docker (2 projets), Vercel Hobby, mode démo, TypeScript 6.0, ESLint 9.
- Initialisation Git (branche `main`) et `.gitignore`.
- Rédaction de `CLAUDE.md` et des documents `/docs` : cahier des charges, architecture, roadmap, backlog, décisions techniques, avancement.

**Vérifications**
- `git status` : seuls les fichiers de documentation et `.gitignore` sont suivis ; aucun secret.

**Problèmes / points ouverts**
- CLI GitHub (`gh`) non installée : le dépôt GitHub sera créé manuellement par l'utilisateur.
- CLI Supabase non installée : utilisée via `npx supabase`.

## Prochaine étape

**Phase 1 — Initialisation (B-003, B-004, B-005)** : créer le projet Next.js 16 avec TypeScript 6.0 strict, Tailwind 4, ESLint 9, configurer Vitest et Playwright, initialiser shadcn/ui, et vérifier que l'application démarre. À présenter en détail avant exécution.
