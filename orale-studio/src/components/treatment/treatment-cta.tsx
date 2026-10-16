import type { Topic } from "@/lib/booking/schema";
import { BookingTrigger } from "@/components/booking/booking-context";
import { Halo, MaskLines, Reveal } from "@/components/motion/primitives";

/**
 * Encerramento da página: painel em azul profundo, contido na grade (e não de
 * borda a borda), para se distinguir do rodapé. Abre o agendamento com o
 * assunto do tratamento já selecionado.
 */
export function TreatmentCta({ topic }: { topic: Topic }) {
  return (
    <section aria-labelledby="tratamento-cta-titulo" className="pb-16 lg:pb-24">
      <div className="container-edge">
        <div className="on-deep relative isolate overflow-hidden rounded-media bg-deep px-6 py-16 text-white sm:px-10 sm:py-20 lg:grid lg:grid-cols-12 lg:gap-x-6 lg:px-16 lg:py-24">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <Halo tone="deep" className="-right-[12%] -top-[70%] size-[46rem] max-w-none" strength={18} />
          </div>

          <div className="lg:col-span-7">
            <MaskLines
              as="h2"
              id="tratamento-cta-titulo"
              lines={["Primeiro,", "uma conversa"]}
              className="text-heading font-light tracking-[-0.045em] lg:text-[min(5vw,4.5rem)] lg:leading-[1]"
              lineClassNames={[undefined, "pl-[0.9em] text-periwinkle-soft"]}
            />
          </div>

          <div className="mt-10 lg:col-span-4 lg:col-start-9 lg:mt-0 lg:self-end">
            <Reveal>
              <p className="max-w-[34ch] text-[1.0625rem] leading-relaxed text-mineral">
                Na avaliação, ouvimos o que você procura e explicamos as opções indicadas para o seu caso.
              </p>
            </Reveal>
            <Reveal delay={0.08} className="mt-8">
              <BookingTrigger variant="light" topic={topic} />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
