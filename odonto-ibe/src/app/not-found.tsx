import type { Metadata } from "next";
import { Tooth } from "@/components/brand/tooth";
import { ButtonLink } from "@/components/ui/button";
import { MaskHeading } from "@/components/ui/mask-heading";

export const metadata: Metadata = { title: "Página não encontrada", robots: { index: false } };

export default function NotFound() {
  return (
    <section className="pt-(--header-h)">
      <div className="container-edge flex min-h-[70dvh] flex-col items-start justify-center py-20" data-load="">
        <Tooth className="h-24 w-auto text-turquoise" strokeWidth={2.4} pathClassName="rv-draw" />
        <MaskHeading as="h1" load delay={150} lines={["Esta página não existe."]} className="mt-8 text-title [--wght:580]" />
        <p className="rv-fade mt-5 max-w-[44ch] text-lead text-stone [--d:400ms]">
          O endereço pode ter mudado ou sido digitado de outro jeito. A página inicial tem tudo o que você precisa.
        </p>
        <div className="rv-fade mt-8 [--d:520ms]">
          <ButtonLink href="/" size="lg">
            Ir para a página inicial
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
