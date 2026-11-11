import type { CSSProperties } from "react";
import { showDraftNotes } from "@/config/site";
import { faq } from "@/content/faq";
import { faqSection } from "@/content/home";
import { MaskHeading } from "@/components/ui/mask-heading";

/**
 * Perguntas frequentes em <details> nativo: funciona sem JavaScript, é
 * acessível por teclado e leitor de tela, e a altura anima em CSS onde o
 * navegador permite. `name` faz abrir uma pergunta fechar a anterior.
 */
export function Faq() {
  return (
    <section aria-labelledby="faq-title" className="py-(--spacing-section)">
      <div className="container-edge grid grid-cols-1 gap-x-8 gap-y-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+3rem)]">
            <MaskHeading id="faq-title" lines={[faqSection.title]} className="max-w-[12ch] text-title [--wght:570]" />
          </div>
        </div>

        <div data-reveal="" className="lg:col-span-7 lg:col-start-6">
          {faq.map((item, index) => (
            <details key={item.question} name="faq" className="faq-item rv-fade group border-b border-forest/15" style={{ "--i": index } as CSSProperties}>
              <summary className="flex items-start justify-between gap-6 rounded-brand py-5 lg:py-6">
                <h3 className="display text-[1.1875rem] leading-snug transition-[font-variation-settings] duration-500 ease-out-expo [--wght:500] group-open:[--wght:640] lg:text-[1.375rem]">
                  {item.question}
                </h3>
                <span aria-hidden="true" className="relative mt-1 block size-5 shrink-0 text-teal">
                  <span className="faq-icon-bar absolute inset-x-0 top-1/2 block h-0.5 -translate-y-1/2 bg-current" />
                  <span className="faq-icon-bar faq-icon-bar-v absolute inset-y-0 left-1/2 block w-0.5 -translate-x-1/2 bg-current" />
                </span>
              </summary>
              <div className="pb-6 lg:pb-7">
                <p className="max-w-[60ch] leading-relaxed text-stone">{item.answer}</p>
                {item.draft && showDraftNotes ? (
                  <p data-draft-note="" className="mt-3 text-[0.8125rem] text-stone">
                    <span className="rounded-brand border border-dashed border-stone/60 px-1.5 py-0.5 text-[0.6875rem] font-semibold">Provisório</span>{" "}
                    Resposta a confirmar com a clínica.
                  </p>
                ) : null}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
