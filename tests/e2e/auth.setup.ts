import { writeFileSync } from "node:fs";

import { expect, test as setup } from "@playwright/test";

import { AUTH_STATE_FILE, AUTH_WORKSPACE_FILE } from "./helpers/auth-state";
import { byLabel } from "./helpers/locators";
import { createTestUser } from "./helpers/test-users";

setup("ouvre une session de test", async ({ page }) => {
  const user = await createTestUser("Camille Test");

  await page.goto("/connexion");
  await byLabel(page, "Adresse e-mail").fill(user.email);
  await byLabel(page, "Mot de passe", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(`/w/${user.slug}/tableau-de-bord`);

  await page.context().storageState({ path: AUTH_STATE_FILE });
  writeFileSync(AUTH_WORKSPACE_FILE, JSON.stringify({ slug: user.slug }));
});
