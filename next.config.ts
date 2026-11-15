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
  // En-têtes de sécurité sur toutes les réponses (HSTS est fourni par Vercel ; pas de CSP stricte :
  // incompatible sans nonce avec les scripts intégrés de Next — DT-038).
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
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
