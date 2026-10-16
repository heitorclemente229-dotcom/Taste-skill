import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { brand } from "@/config/site";
import { getTreatment, treatments } from "@/content/treatments";
import { getTreatmentDetail } from "@/content/treatment-details";
import { TreatmentHero } from "@/components/treatment/treatment-hero";
import { TreatmentContent } from "@/components/treatment/treatment-content";
import { OtherTreatments } from "@/components/treatment/other-treatments";
import { TreatmentCta } from "@/components/treatment/treatment-cta";

type Props = { params: Promise<{ slug: string }> };

// Somente os tratamentos cadastrados existem; qualquer outro endereço retorna 404.
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return treatments.map((treatment) => ({ slug: treatment.slug }));
}

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { slug } = await params;
  const treatment = getTreatment(slug);
  if (!treatment) return {};

  const url = `/tratamentos/${treatment.slug}`;
  const title = `${treatment.title} · ${brand.fullName}`;
  // O openGraph da página substitui o do layout por inteiro: mantém as imagens herdadas.
  const inherited = await parent;
  const ogImages = inherited.openGraph?.images;
  const twitterImages = inherited.twitter?.images;

  return {
    title: treatment.title,
    description: treatment.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: brand.fullName,
      url,
      title,
      description: treatment.summary,
      ...(ogImages?.length ? { images: ogImages } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: treatment.summary,
      ...(twitterImages?.length ? { images: twitterImages } : {}),
    },
  };
}

export default async function TreatmentPage({ params }: Props) {
  const { slug } = await params;
  const treatment = getTreatment(slug);
  const detail = treatment ? getTreatmentDetail(treatment.slug) : undefined;
  if (!treatment || !detail) notFound();

  const position = treatments.indexOf(treatment) + 1;

  return (
    <>
      <TreatmentHero treatment={treatment} detail={detail} position={position} total={treatments.length} />
      <TreatmentContent detail={detail} />
      <OtherTreatments currentSlug={treatment.slug} />
      <TreatmentCta topic={treatment.topic} />
    </>
  );
}
