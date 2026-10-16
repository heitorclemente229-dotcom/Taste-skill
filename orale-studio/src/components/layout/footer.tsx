import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { brand, contact, formatAddress, legal } from "@/config/site";
import { footer } from "@/content/home";
import { BrandSymbol } from "@/components/brand/logo";

export function Footer() {
  const year = new Date().getFullYear();
  const a = contact.address;
  return (
    <footer id="contato" className="on-deep relative overflow-hidden bg-deep text-white">
      <div className="container-edge relative pb-10 pt-20 lg:pt-28">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-4">
            <h2 className="text-heading font-light tracking-[-0.04em]">{footer.title}</h2>
            <address className="mt-8 not-italic leading-relaxed text-mineral">
              {a.street}
              <br />
              {a.district}, {a.city}/{a.state}
              <br />
              CEP {a.postalCode}
            </address>
            <a
              href={contact.address.mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group/map mt-5 inline-flex items-center gap-2 py-1 text-[0.95rem] font-medium text-white"
              aria-label={`Como chegar: abrir ${formatAddress()} no mapa, em nova aba`}
            >
              <span className="border-b border-white/30 pb-0.5 transition-colors group-hover/map:border-white">Como chegar</span>
              <ArrowUpRight className="size-4 transition-transform duration-500 group-hover/map:rotate-45" strokeWidth={1.6} aria-hidden="true" />
            </a>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 lg:col-span-8 lg:col-start-6">
            <FooterColumn title="Contato">
              <li>
                <a href={contact.phone.href} className="hover:text-white">
                  {contact.phone.display}
                </a>
              </li>
              <li>
                <a href={contact.whatsapp.href} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  WhatsApp {contact.whatsapp.display}
                </a>
              </li>
              <li>
                <a href={`mailto:${contact.email}`} className="break-all hover:text-white">
                  {contact.email}
                </a>
              </li>
            </FooterColumn>

            <FooterColumn title="Horários">
              {contact.hours.map((slot) => (
                <li key={slot.days}>
                  <span className="block text-white/90">{slot.days}</span>
                  <span className="tabular">{slot.time}</span>
                </li>
              ))}
            </FooterColumn>

            <FooterColumn title="Navegação">
              <li>
                <Link href="/#tratamentos" className="hover:text-white">
                  Tratamentos
                </Link>
              </li>
              <li>
                <Link href="/agendar" className="hover:text-white">
                  Agendar consulta
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="hover:text-white">
                  Aviso de privacidade
                </Link>
              </li>
              {contact.social.map((item) => (
                <li key={item.label}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    {item.label}
                  </a>
                </li>
              ))}
            </FooterColumn>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-8 border-t border-white/10 pt-8 lg:mt-28 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3">
            <BrandSymbol className="size-10" tone="light" />
            <p className="text-sm text-mineral">
              © {year} {brand.fullName}
            </p>
          </div>
          <dl className="grid gap-x-8 gap-y-1.5 text-[0.8rem] leading-relaxed text-mineral sm:grid-cols-[auto_1fr] lg:text-right">
            <dt className="sr-only">Razão social</dt>
            <dd className="sm:col-span-2">
              {legal.companyName}, CNPJ {legal.cnpj}
            </dd>
            <dt className="sr-only">Responsável técnico</dt>
            <dd className="sm:col-span-2">
              Responsável técnico: {legal.technicalLead.name}, {legal.technicalLead.registry}
            </dd>
            <dt className="sr-only">Inscrição da clínica</dt>
            <dd className="sm:col-span-2">Inscrição da clínica: {legal.clinicRegistry}</dd>
          </dl>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-white">{title}</h3>
      <ul className="mt-5 flex flex-col gap-3 text-[0.95rem] leading-relaxed text-mineral [&_a]:transition-colors [&_a]:duration-300">
        {children}
      </ul>
    </div>
  );
}
