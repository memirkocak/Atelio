import { defineConfig, devices } from "@playwright/test";

// Les tests E2E utilisent le projet Supabase atelio-dev (clés dans .env.local).
try {
  process.loadEnvFile(".env.local");
} catch {
  // En CI, les variables sont fournies par l'environnement.
}

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  // Serveur de développement : chaque page est compilée à la première visite.
  // Délais et parallélisme ajustés pour éviter les faux échecs sous charge (DT-031).
  workers: 3,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  // Supprime les comptes de test (e2e-…@example.com) une fois tous les tests terminés.
  globalTeardown: "./tests/e2e/global-teardown.ts",
  use: {
    baseURL,
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
    trace: "on-first-retry",
  },
  projects: [
    // Ouvre une session de test réutilisée par les specs qui en ont besoin.
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
