import { expect, type Browser, type TestType } from "@playwright/test";

import { byLabel } from "./locators";
import { createTestUser } from "./test-users";

const BASE_URL = "http://localhost:3000";

type IsolatedUser = {
  slug: string;
  email: string;
  /** Crée l'utilisateur et ouvre sa session (une seule fois par worker). */
  ensure: (browser: Browser) => Promise<string>;
};

/**
 * Donne à un fichier de tests son PROPRE utilisateur et son propre espace, connecté une seule
 * fois puis réutilisé par chaque test (storageState). Évite que des suites exécutées en
 * parallèle partagent des données (compteurs, listes, états vides).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TestType générique de Playwright
export function isolatedUser(test: TestType<any, any>, key: string, fullName: string): IsolatedUser {
  const stateFile = `playwright/.auth/${key}.json`;
  let ready: Promise<string> | null = null;

  const user: IsolatedUser = {
    slug: "",
    email: "",
    ensure(browser) {
      ready ??= (async () => {
        const created = await createTestUser(fullName);
        const context = await browser.newContext({ baseURL: BASE_URL });
        const page = await context.newPage();
        await page.goto("/connexion");
        await byLabel(page, "Adresse e-mail").fill(created.email);
        await byLabel(page, "Mot de passe", { exact: true }).fill(created.password);
        await page.getByRole("button", { name: "Se connecter" }).click();
        await expect(page).toHaveURL(`/w/${created.slug}/tableau-de-bord`);
        await context.storageState({ path: stateFile });
        await context.close();
        user.slug = created.slug;
        user.email = created.email;
        return stateFile;
      })();
      return ready;
    },
  };

  test.beforeAll(async ({ browser }) => {
    await user.ensure(browser);
  });
  // Forme « fonction » : le fichier de session n'est lu qu'une fois la connexion faite.
  test.use({
    // (paramètre « provide » = « use » de Playwright, renommé pour la règle react-hooks)
    storageState: async (
      { browser }: { browser: Browser },
      provide: (stateFile: string) => Promise<void>,
    ) => {
      await provide(await user.ensure(browser));
    },
  });

  return user;
}
