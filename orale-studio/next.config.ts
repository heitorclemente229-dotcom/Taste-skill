import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança estáticos, aplicados a todas as rotas
 * (páginas, API e arquivos estáticos). A Content-Security-Policy com nonce
 * e o HSTS são definidos em `src/proxy.ts`, porque dependem da requisição.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: [
      "accelerometer=()",
      "autoplay=()",
      "browsing-topics=()",
      "camera=()",
      "display-capture=()",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "payment=()",
      "usb=()",
    ].join(", "),
  },
  // Equivalente legado de `frame-ancestors 'none'` para navegadores antigos.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Não anuncia a tecnologia do servidor no cabeçalho `X-Powered-By`.
  poweredByHeader: false,
  reactStrictMode: true,
  // Source maps não são publicados para o navegador em produção.
  productionBrowserSourceMaps: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // Lista fechada de qualidades: evita que terceiros usem o otimizador
    // para gerar variações arbitrárias.
    qualities: [70, 80],
    deviceSizes: [640, 750, 828, 1080, 1280, 1600, 1920, 2400],
    imageSizes: [96, 160, 256, 384],
    // Somente imagens locais. Nenhum domínio remoto é permitido.
    remotePatterns: [],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
