import { requireUser } from "@/lib/auth/session";

import { UserMenuDropdown } from "./user-menu-dropdown";

/**
 * Menu utilisateur de la sidebar. Lit la session : à placer dans <Suspense>.
 * Sert aussi de garde côté serveur (en plus du proxy) : redirige si la session est absente.
 */
export async function UserMenu() {
  const user = await requireUser();
  if (user.isAnonymous) return <UserMenuDropdown name="Visiteur" email="Session de démonstration" />;
  return <UserMenuDropdown name={user.fullName ?? user.email} email={user.email} />;
}
