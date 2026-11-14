import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  logging: {
    // Ne pas journaliser les arguments des Server Actions en développement :
    // ils contiennent des mots de passe (connexion, inscription).
    serverFunctions: false,
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      {
        // /w/<espace> mène au tableau de bord de l'espace
        source: "/w/:slug",
        destination: "/w/:slug/tableau-de-bord",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
