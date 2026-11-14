import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

/** Préfixe des comptes créés par les tests : ils sont supprimés à la fin. */
export const TEST_EMAIL_PREFIX = "e2e-";
export const TEST_PASSWORD = "Atelio-test-2026";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error("Tests E2E : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY sont requis (.env.local).");
  }
  return createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
}

export function uniqueTestEmail(): string {
  return `${TEST_EMAIL_PREFIX}${randomUUID().slice(0, 8)}@example.com`;
}

/** Crée un utilisateur déjà confirmé (indépendant du réglage de confirmation par e-mail). */
export async function createTestUser(fullName = "Camille Test") {
  const email = uniqueTestEmail();
  const { error } = await adminClient().auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw error;
  return { email, password: TEST_PASSWORD, fullName };
}

/** Supprime tous les comptes de test (préfixe e2e-, domaine example.com). */
export async function deleteTestUsers() {
  const admin = adminClient();
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const targets = data.users.filter(
      (u) => u.email?.startsWith(TEST_EMAIL_PREFIX) && u.email.endsWith("@example.com"),
    );
    for (const user of targets) await admin.auth.admin.deleteUser(user.id);
    if (data.users.length < 200) break;
  }
}
