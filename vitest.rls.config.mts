import { defineConfig } from "vitest/config";

// Tests de sécurité RLS : exécutés contre le projet Supabase de dev (réseau requis).
// Clés lues dans .env.local ; comptes de test créés puis supprimés.
try {
  process.loadEnvFile(".env.local");
} catch {
  // En CI, les variables sont fournies par l'environnement.
}

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/rls/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Un seul fichier à la fois : les tests partagent des comptes et limitent les appels à l'API.
    fileParallelism: false,
  },
});
