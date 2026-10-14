import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { contact } from "@/config/site";
import { BookingForm } from "@/components/booking/booking-form";
import { Halo, MaskLines, Reveal } from "@/components/motion/primitives";
import { DemoNote } from "@/components/ui/demo-note";

export const metadata: Metadata = {
  title: "Agendar consulta",
  description:
    "Solicite uma consulta pelo formulário, pelo WhatsApp ou por telefone. A equipe retorna para confirmar data e horário.",
  alternates: { canonical: "/agendar" },
  robots: { index: true, follow: true },
};

/**
 * Página de agendamento: destino dos botões "Agendar consulta" quando o
 * diálogo não abre (sem JavaScript, nova aba ou link direto).
 */
export default function AgendarPage() {
  // Mesma regra do layout: o Turnstile só liga com as duas chaves definidas.
  const turnstileSiteKey =
    process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY ? process.env.TURNSTILE_SITE_KEY : undefined;

  return (
    <section aria-labelledby="agendar-title" className="relative isolate overflow-hidden pt-[var(--header-h)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <Halo className="-left-[18rem] -top-[14rem] size-[44rem] max-w-none lg:-left-[10rem] lg:size-[56rem]" strength={18} />
      </div>

      <div className="container-edge grid gap-14 pb-section pt-10 sm:pt-14 lg:grid-cols-12 lg:gap-6 lg:pt-20">
        <div className="lg:col-span-5">
          <MaskLines
            as="h1"
            id="agendar-title"
            mount
            delay={0.1}
            lines={["Agendar", "consulta"]}
            className="text-title font-light tracking-[-0.05em]"
            lineClassNames={[undefined, "pl-[0.9em] text-accent-display"]}
          />
          <Reveal mount delay={0.45} className="mt-8 max-w-[30ch] text-lead text-slate lg:ml-[0.3rem]">
            <p>Envie seus dados e retornamos para confirmar data e horário.</p>
          </Reveal>

          <Reveal mount delay={0.6} className="mt-12 grid gap-10 sm:grid-cols-2 lg:mt-16 lg:ml-[0.3rem] lg:grid-cols-1 xl:grid-cols-2">
            <div>
              <h2 className="text-sm font-medium text-deep">Prefere falar agora?</h2>
              <ul className="mt-3 flex flex-col">
                <li>
                  <a
                    href={contact.whatsapp.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/ch inline-flex min-h-11 items-center gap-2 text-[0.95rem] text-deep"
                  >
                    <span className="border-b border-deep/25 pb-0.5 transition-colors duration-300 group-hover/ch:border-deep">
                      WhatsApp {contact.whatsapp.display}
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 transition-transform duration-500 ease-out-expo group-hover/ch:rotate-45"
                      strokeWidth={1.6}
                    />
                    <span className="visually-hidden">(abre em nova aba)</span>
                  </a>
                </li>
                <li>
                  <a href={contact.phone.href} className="group/ch inline-flex min-h-11 items-center text-[0.95rem] text-deep">
                    <span className="border-b border-deep/25 pb-0.5 transition-colors duration-300 group-hover/ch:border-deep">
                      Telefone {contact.phone.display}
                    </span>
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-sm font-medium text-deep">Horários</h2>
              <dl className="mt-4 flex flex-col gap-3 text-[0.95rem] leading-relaxed">
                {contact.hours.map((slot) => (
                  <div key={slot.days}>
                    <dt className="text-slate">{slot.days}</dt>
                    <dd className="tabular text-deep">{slot.time}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>

          <Reveal mount delay={0.7} className="mt-10 lg:ml-[0.3rem]">
            <p className="max-w-[40ch] text-sm leading-relaxed text-slate">
              O envio é uma solicitação. A data e o horário só ficam reservados depois da confirmação da equipe.
            </p>
            {contact.isPlaceholder ? (
              <DemoNote className="mt-6">Telefone, WhatsApp e horários são exemplos e serão trocados pelos dados da clínica.</DemoNote>
            ) : null}
          </Reveal>
        </div>

        <Reveal mount delay={0.3} y={32} className="lg:col-span-6 lg:col-start-7">
          <div className="rounded-surface bg-white p-6 shadow-[0_40px_80px_-48px_rgb(21_43_58/0.35)] ring-1 ring-deep/5 sm:p-10 lg:p-12">
            <h2 className="visually-hidden">Formulário de solicitação</h2>
            <BookingForm context="page" turnstileSiteKey={turnstileSiteKey} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
