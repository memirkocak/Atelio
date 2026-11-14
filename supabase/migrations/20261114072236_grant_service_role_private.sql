-- =============================================================================
-- Atelio — Migration 0003 : accès du rôle service_role aux fonctions privées
-- =============================================================================
-- Le client d'administration (clé secrète, rôle service_role) contourne la RLS mais
-- doit pouvoir évaluer les colonnes générées et contraintes qui appellent des
-- fonctions du schéma `private` (ex. clients.search_text → private.normalize_search).
-- Sans ce droit : « permission denied for function normalize_search » lors d'un
-- insert d'administration (scripts de seed / démo, tests).
-- Le schéma `private` reste non exposé par l'API (aucun appel RPC possible).
-- =============================================================================

grant usage on schema private to service_role;
grant execute on function private.normalize_search(text) to service_role;
