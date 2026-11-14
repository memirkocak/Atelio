import { expect, test as setup } from "@playwright/test";

import { AUTH_STATE_FILE } from "./helpers/auth-state";
import { createTestUser } from "./helpers/test-users";

setup("ouvre une session de test", async ({ page }) => {
  const user = await createTestUser("Camille Test");

  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill(user.email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("/demarrage");

  await page.context().storageState({ path: AUTH_STATE_FILE });
});
