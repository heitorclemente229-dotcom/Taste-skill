import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { brand, siteUrl } from "@/config/site";
import { getTurnstileSiteKey } from "@/lib/booking/server/env";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

// As fontes são baixadas no build e servidas pelo próprio site (sem requisições
// ao Google em tempo de execução, o que simplifica a CSP e a privacidade).
const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export function generateMetadata(): Metadata {
  return {
    metadataBase: siteUrl(),
    title: {
      default: `${brand.fullName} · Odontologia contemporânea`,
      template: `%s · ${brand.fullName}`,
    },
    description: brand.description,
    applicationName: brand.fullName,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: brand.fullName,
      title: `${brand.fullName} · Odontologia contemporânea`,
      description: brand.description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${brand.fullName} · Odontologia contemporânea`,
      description: brand.description,
    },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f9fb",
  colorScheme: "light",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Nonce gerado por requisição em src/proxy.ts (CSP). Ler os cabeçalhos
  // torna a renderização dinâmica, requisito para nonces.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  // Mesma regra do servidor: o widget só aparece quando a API exige o token.
  const turnstileSiteKey = getTurnstileSiteKey() ?? undefined;

  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" className={`${manrope.variable} ${cormorant.variable}`}>
      <body>
        {/* Sem JavaScript, os elementos animados aparecem no estado final. */}
        <noscript>
          <style nonce={nonce}>{`[data-reveal]{opacity:1!important;transform:none!important;clip-path:none!important}`}</style>
        </noscript>
        <a
          href="#conteudo"
          className="visually-hidden focus:not-sr-only fixed top-3 left-3 z-50 rounded-full bg-deep px-5 py-3 text-sm text-white focus:!m-0 focus:!h-auto focus:!w-auto focus:!overflow-visible focus:![clip:auto] focus:![white-space:normal]"
        >
          Pular para o conteúdo
        </a>
        <Providers turnstileSiteKey={turnstileSiteKey}>
          <Header />
          <main id="conteudo" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
