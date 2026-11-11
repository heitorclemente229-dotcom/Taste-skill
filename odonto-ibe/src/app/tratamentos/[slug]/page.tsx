import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ViewTransition, type CSSProperties } from "react";
import { address, brand } from "@/config/site";
import { getTreatment, treatments } from "@/content/treatments";
import { treatmentMessage } from "@/lib/whatsapp";
import { Cta } from "@/components/sections/cta";
import { Magnetic } from "@/components/motion/magnetic";
import { DraftNote, PhotoDraftCaption } from "@/components/ui/draft-note";
import { MaskHeading } from "@/components/ui/mask-heading";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return treatments.map((treatment) => ({ slug: treatment.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tratamentos/[slug]">): Promise<Metadata> {
  const treatment = getTreatment((await params).slug);
  if (!treatment) return {};
  const title = `${treatment.name} no ${address.district}`;
  return {
    title,
    description: `${treatment.summary} ${brand.name}, ${address.district}, ${address.region} de ${address.city}.`,
    alternates: { canonical: `/tratamentos/${treatment.slug}` },
    // Tratamento ainda não validado pela clínica: a página existe, mas fica fora do Google.
    robots: treatment.confirmed ? undefined : { index: false, follow: true },
    openGraph: { title: `${title} | ${brand.name}`, description: treatment.summary, url: `/tratamentos/${treatment.slug}` },
  };
}

export default async function TreatmentPage({ params }: PageProps<"/tratamentos/[slug]">) {
  const { slug } = await params;
  const treatment = getTreatment(slug);
  if (!treatment) notFound();

  const index = treatments.indexOf(treatment);
  const next = treatments[(index + 1) % treatments.length];
  const previous = treatments[(index - 1 + treatments.length) % treatments.length];

  return (
    <>
      <article className="pt-(--header-h)">
        <div className="container-edge grid grid-cols-1 gap-x-8 gap-y-10 pt-8 pb-(--spacing-section) lg:grid-cols-12 lg:pt-14">
          <div className="lg:col-span-6 lg:pt-10" data-load="">
            <Link
              href="/#tratamentos"
              className="rv-fade group inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-semibold text-teal"
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.75} className="transition-transform duration-500 ease-out-expo group-hover:-translate-x-1" />
              Todos os tratamentos
            </Link>

            <MaskHeading as="h1" load delay={120} lines={[treatment.name]} className="mt-6 text-[clamp(2.5rem,6vw,5rem)] leading-none [--wght:600]" />

            <p className="rv-fade mt-6 max-w-[44ch] text-lead text-stone" style={{ "--d": "360ms" } as CSSProperties}>
              {treatment.summary}
            </p>

            {treatment.confirmed ? null : (
              <div className="rv-fade mt-5" style={{ "--d": "440ms" } as CSSProperties}>
                <DraftNote>Tratamento em validação com a clínica. Confirme a disponibilidade pelo WhatsApp.</DraftNote>
              </div>
            )}

            <div className="rv-fade mt-9" style={{ "--d": "520ms" } as CSSProperties}>
              <Magnetic>
                <WhatsAppLink label="Perguntar sobre este tratamento" message={treatmentMessage(treatment.name)} size="lg" />
              </Magnetic>
            </div>
          </div>

          <figure className="lg:col-span-5 lg:col-start-8">
            {/* Mesmo nome da foto na lista da página inicial: a imagem viaja de lá para cá. */}
            <ViewTransition name={`tratamento-${treatment.slug}`} share="vt-photo" default="none">
              <div className="aspect-[4/5] overflow-hidden rounded-brand bg-mist">
                <Image
                  src={treatment.photo.src}
                  alt={treatment.photo.alt}
                  placeholder="blur"
                  preload
                  fetchPriority="high"
                  loading="eager"
                  quality={80}
                  sizes="(min-width: 1024px) 38vw, 100vw"
                  className="h-full w-full object-cover"
                />
              </div>
            </ViewTransition>
            {treatment.photo.provisional ? <PhotoDraftCaption /> : null}
          </figure>
        </div>

        <div className="bg-mist py-(--spacing-section)">
          <div className="container-edge grid grid-cols-1 gap-x-8 gap-y-12 lg:grid-cols-12">
            <div data-reveal="" className="lg:col-span-6">
              <h2 className="rv-fade display text-heading [--wght:580]">Sobre o tratamento</h2>
              <div className="mt-6 space-y-5">
                {treatment.about.map((paragraph, paragraphIndex) => (
                  <p key={paragraph} className="rv-fade max-w-[58ch] text-lead" style={{ "--i": paragraphIndex + 1 } as CSSProperties}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <div data-reveal="" className="lg:col-span-5 lg:col-start-8">
              <h2 className="rv-fade display text-heading [--wght:580]">Quando procurar o dentista</h2>
              <ul className="mt-6">
                {treatment.whenToSeek.map((item, itemIndex) => (
                  <li key={item} className="relative py-4 leading-relaxed">
                    <span aria-hidden="true" className="rv-grow absolute inset-x-0 top-0 block h-0.5 origin-left bg-turquoise" style={{ "--i": itemIndex } as CSSProperties} />
                    <span className="rv-fade block" style={{ "--i": itemIndex + 1 } as CSSProperties}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="rv-fade mt-6 text-[0.875rem] leading-relaxed text-stone" style={{ "--i": 4 } as CSSProperties}>
                Conteúdo informativo. A indicação de qualquer tratamento depende de avaliação presencial com o cirurgião-dentista.
              </p>
            </div>
          </div>
        </div>

        <nav aria-label="Outros tratamentos" className="container-edge grid grid-cols-1 gap-4 py-12 sm:grid-cols-2 lg:py-16">
          <Link href={`/tratamentos/${previous.slug}`} className="group flex min-h-24 flex-col justify-center rounded-brand border border-forest/15 px-5 py-4 transition-colors duration-300 hover:border-forest">
            <span className="inline-flex items-center gap-2 text-[0.875rem] text-stone">
              <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.75} className="transition-transform duration-500 ease-out-expo group-hover:-translate-x-1" />
              Anterior
            </span>
            <span className="display mt-1 text-[1.375rem] transition-[font-variation-settings] duration-500 ease-out-expo [--wght:480] group-hover:[--wght:640]">
              {previous.name}
            </span>
          </Link>
          <Link href={`/tratamentos/${next.slug}`} className="group flex min-h-24 flex-col items-end justify-center rounded-brand border border-forest/15 px-5 py-4 text-right transition-colors duration-300 hover:border-forest">
            <span className="inline-flex items-center gap-2 text-[0.875rem] text-stone">
              Próximo
              <ArrowRight aria-hidden="true" size={16} strokeWidth={1.75} className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1" />
            </span>
            <span className="display mt-1 text-[1.375rem] transition-[font-variation-settings] duration-500 ease-out-expo [--wght:480] group-hover:[--wght:640]">
              {next.name}
            </span>
          </Link>
        </nav>
      </article>

      <Cta />
    </>
  );
}
