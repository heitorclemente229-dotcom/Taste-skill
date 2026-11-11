import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";
import { address, brand, siteUrl } from "@/config/site";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileDock } from "@/components/layout/mobile-dock";
import { RevealObserver } from "@/components/motion/reveal-observer";
import { JsonLd } from "@/components/seo/json-ld";

// As fontes são baixadas no build e servidas pelo próprio site: nenhuma
// requisição ao Google em tempo de execução (CSP e privacidade mais simples).
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

// Fonte de exibição variável. Os eixos de peso (wght) e largura (wdth) são
// animados nos títulos; o tamanho óptico (opsz) ajusta o desenho ao corpo.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  variable: "--font-bricolage",
  display: "swap",
});

const title = `${brand.name} | Clínica odontológica no ${address.district}, ${address.region} de ${address.city}`;

export function generateMetadata(): Metadata {
  return {
    metadataBase: siteUrl(),
    title: { default: title, template: `%s | ${brand.name}` },
    description: brand.description,
    applicationName: brand.name,
    alternates: { canonical: "/" },
    keywords: [
      "dentista no Jardim São Luís",
      "clínica odontológica na Zona Leste",
      "dentista em São Paulo",
      "odontologia integrada",
      "Odonto Ibe",
    ],
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: brand.name,
      title,
      description: brand.description,
      url: "/",
    },
    twitter: { card: "summary_large_image", title, description: brand.description },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fafcfb",
  colorScheme: "light",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Nonce gerado por requisição em src/proxy.ts (CSP). Ler os cabeçalhos
  // torna a renderização dinâmica, requisito para nonces.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" className={`${figtree.variable} ${bricolage.variable}`}>
      <body>
        {/* Sem JavaScript, o que seria revelado ao rolar aparece no estado final. */}
        <noscript>
          <style nonce={nonce}>{`[data-reveal] *,[data-reveal]{opacity:1!important;transform:none!important;stroke-dashoffset:0!important}`}</style>
        </noscript>
        <a
          href="#conteudo"
          className="visually-hidden focus:not-sr-only fixed top-3 left-3 z-50 rounded-brand bg-forest px-5 py-3 text-sm text-paper focus:!m-0 focus:!h-auto focus:!w-auto focus:!overflow-visible focus:![clip:auto] focus:![white-space:normal]"
        >
          Pular para o conteúdo
        </a>
        <Header />
        <main id="conteudo" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <Footer />
        <MobileDock />
        <RevealObserver />
        <JsonLd nonce={nonce} />
      </body>
    </html>
  );
}
