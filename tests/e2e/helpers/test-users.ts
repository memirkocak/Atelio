import {
  createConfirmedUser,
  deleteTestUsers as deleteUsersWithPrefix,
  getWorkspaceSlug,
  TEST_PASSWORD,
  uniqueTestEmail as uniqueEmailWithPrefix,
} from "../../support/supabase-test";

/** Préfixe des comptes créés par les tests E2E : ils sont supprimés à la fin (avec leurs espaces). */
export const TEST_EMAIL_PREFIX = "e2e-";
export { TEST_PASSWORD };

export function uniqueTestEmail(): string {
  return uniqueEmailWithPrefix(TEST_EMAIL_PREFIX);
}

/** Crée un utilisateur déjà confirmé et renvoie aussi le slug de son espace personnel. */
export async function createTestUser(fullName = "Camille Test") {
  const user = await createConfirmedUser(TEST_EMAIL_PREFIX, fullName);
  return { ...user, slug: await getWorkspaceSlug(user.id) };
}

export async function deleteTestUsers() {
  await deleteUsersWithPrefix(TEST_EMAIL_PREFIX);
}
