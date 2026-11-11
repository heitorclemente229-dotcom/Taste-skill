import { ArrowUpRight, Star } from "lucide-react";
import type { CSSProperties } from "react";
import { googleRating, maps } from "@/config/site";
import { reviewsSection } from "@/content/home";
import { publishedReviews } from "@/content/reviews";
import { Counter } from "@/components/motion/counter";
import { ButtonLink } from "@/components/ui/button";
import { DraftNote } from "@/components/ui/draft-note";
import { MaskHeading } from "@/components/ui/mask-heading";
import { SwipeRow } from "@/components/ui/swipe-row";

/**
 * Prova social. A nota e o total vêm do perfil da clínica no Google e os
 * trechos são reais (ver src/content/reviews.ts). Os números sobem em
 * contagem quando a seção entra na tela; as estrelas acendem em sequência.
 */
export function Reviews() {
  const ratingText = googleRating.value.toLocaleString("pt-BR", { minimumFractionDigits: 1 });
  return (
    <section id="avaliacoes" aria-labelledby="avaliacoes-title" className="bg-mist py-(--spacing-section)">
      <div className="container-edge">
        <MaskHeading
          id="avaliacoes-title"
          lines={["A confiança de quem já", "conhece nosso trabalho."]}
          className="text-title [--wght:570]"
        />

        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 lg:mt-20 lg:grid-cols-12">
          <div className="lg:col-span-4" data-reveal="">
            <p className="display rv-type text-[clamp(5.5rem,13vw,10.5rem)] leading-[0.85] [--wght:640]">
              <Counter value={googleRating.value} decimals={1} className="tabular" />
            </p>
            <p className="mt-5 flex items-center gap-1.5" role="img" aria-label={`Nota ${ratingText} de 5`}>
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  aria-hidden="true"
                  size={22}
                  strokeWidth={1.5}
                  className="rv-fade fill-turquoise text-turquoise"
                  style={{ "--i": index + 2 } as CSSProperties}
                />
              ))}
              <span aria-hidden="true" className="rv-fade ml-2 text-[0.9375rem] text-stone" style={{ "--i": 7 } as CSSProperties}>
                {reviewsSection.ratingLabel}
              </span>
            </p>
            <p className="rv-fade mt-4 text-lead" style={{ "--i": 8 } as CSSProperties}>
              <Counter value={googleRating.count} className="tabular font-semibold" /> {reviewsSection.countLabel}
            </p>
            <div className="rv-fade mt-8" style={{ "--i": 9 } as CSSProperties}>
              <ButtonLink href={maps.placeUrl} variant="outline" icon={<ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.75} />}>
                {reviewsSection.cta}
              </ButtonLink>
            </div>
            <p className="rv-fade mt-5 max-w-[36ch] text-[0.8125rem] text-stone" style={{ "--i": 10 } as CSSProperties}>
              {reviewsSection.source}
            </p>
          </div>

          {publishedReviews.length > 0 ? (
            <div className="-mr-(--spacing-gutter) lg:col-span-7 lg:col-start-6 lg:mr-0">
              <SwipeRow until="lg" label="Trechos de avaliações no Google" focusable listClassName="gap-4 pr-(--spacing-gutter) lg:block lg:space-y-10 lg:pr-0">
                {publishedReviews.map((review, index) => (
                  <li
                    key={review.text}
                    data-reveal=""
                    className="w-[80vw] bg-paper p-6 sm:w-[56vw] lg:w-auto lg:bg-transparent lg:p-0 lg:[&:nth-child(2)]:ml-[12%] lg:[&:nth-child(3)]:ml-[24%]"
                  >
                    <figure className="relative lg:pt-6">
                      <span aria-hidden="true" className="rv-grow absolute inset-x-0 top-0 hidden h-0.5 origin-left bg-turquoise lg:block" />
                      <blockquote>
                        <p className="rv-fade display text-[1.375rem] leading-[1.25] [--wght:480] lg:text-[clamp(1.5rem,2.3vw,2.125rem)]" style={{ "--i": index === 0 ? 1 : 0 } as CSSProperties}>
                          “{review.text}”
                        </p>
                      </blockquote>
                      <figcaption className="rv-fade mt-4 text-[0.875rem] text-stone" style={{ "--i": 2 } as CSSProperties}>
                        {reviewsSection.attribution}
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </SwipeRow>
              <DraftNote className="mt-8 pr-(--spacing-gutter) lg:pr-0">
                Trechos reais do resumo público de avaliações no Google, sem nome de quem avaliou. Publicação definitiva depende de autorização.
              </DraftNote>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
