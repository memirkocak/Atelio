import { readFileSync } from "node:fs";

/** Session de test enregistrée par auth.setup.ts (ignorée par Git). */
export const AUTH_STATE_FILE = "playwright/.auth/user.json";
/** Espace de l'utilisateur de test (slug), enregistré par auth.setup.ts. */
export const AUTH_WORKSPACE_FILE = "playwright/.auth/workspace.json";

export function testWorkspaceSlug(): string {
  return (JSON.parse(readFileSync(AUTH_WORKSPACE_FILE, "utf8")) as { slug: string }).slug;
}
