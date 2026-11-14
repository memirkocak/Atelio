-- =============================================================================
-- Atelio — Migration 0010 : suppression de son propre compte (B-045)
-- =============================================================================
-- * public.delete_my_account() : n'agit QUE sur auth.uid() ; supprime les espaces dont
--   l'utilisateur est le seul propriétaire (contenu supprimé en cascade), puis le compte
--   (auth.users → profil et adhésions en cascade) ;
-- * SECURITY DEFINER : seul moyen de supprimer une ligne de auth.users sans exposer la clé
--   secrète dans un parcours utilisateur ; aucun paramètre, donc aucune autre cible possible ;
-- * le compte de démonstration (espace is_demo) ne peut pas être supprimé (AT010) ;
-- * la vérification du mot de passe est faite par l'application avant l'appel.
-- =============================================================================

create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Accès refusé.' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.workspace_members m
    join public.workspaces w on w.id = m.workspace_id
    where m.user_id = v_uid and w.is_demo
  ) then
    raise exception 'Le compte de démonstration ne peut pas être supprimé.' using errcode = 'AT010';
  end if;

  -- Espaces dont l'utilisateur est le seul propriétaire (sinon : simple départ de l'espace)
  delete from public.workspaces w
  where exists (
      select 1 from public.workspace_members m
      where m.workspace_id = w.id and m.user_id = v_uid and m.role = 'owner'
    )
    and not exists (
      select 1 from public.workspace_members m
      where m.workspace_id = w.id and m.role = 'owner' and m.user_id <> v_uid
    );

  delete from auth.users where id = v_uid;
end;
$$;

comment on function public.delete_my_account() is
  'Supprime le compte connecté et les espaces dont il est le seul propriétaire (irréversible).';

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
