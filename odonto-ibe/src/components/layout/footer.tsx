import Link from "next/link";
import { address, brand, contact, maps, navigation, showDraftNotes } from "@/config/site";
import { whatsappUrl } from "@/lib/whatsapp";
import { Logo } from "@/components/brand/logo";

const linkClass =
  "inline-block py-1 text-paper/80 underline decoration-transparent underline-offset-4 transition-colors duration-300 hover:text-paper hover:decoration-turquoise";

/** Rodapé: o único bloco escuro do site, fechando a página. */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer data-dock-hide="" className="on-forest bg-forest text-paper">
      <div className="container-edge grid gap-12 pt-16 pb-10 md:grid-cols-12 md:gap-8 lg:pt-24">
        <div className="md:col-span-5">
          <Logo className="text-paper" />
          <p className="mt-6 max-w-[34ch] text-[0.9375rem] leading-relaxed text-paper/75">
            Odontologia integrada e atendimento humanizado no {address.district}, {address.region} de {address.city}.
          </p>
        </div>

        <nav aria-label="Rodapé" className="md:col-span-2">
          <h2 className="text-[0.8125rem] font-semibold text-paper/60">Navegação</h2>
          <ul className="mt-4 text-[0.9375rem]">
            {navigation.map((item) => (
              <li key={item.id}>
                <Link href={`/#${item.id}`} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-2">
          <h2 className="text-[0.8125rem] font-semibold text-paper/60">Contato</h2>
          <ul className="mt-4 text-[0.9375rem]">
            <li>
              <a href={contact.phoneHref} className={linkClass}>
                {contact.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className={linkClass}>
                WhatsApp<span className="visually-hidden"> (abre em nova aba)</span>
              </a>
            </li>
            {contact.email ? (
              <li>
                <a href={`mailto:${contact.email}`} className={linkClass}>
                  {contact.email}
                </a>
              </li>
            ) : null}
            {contact.instagramUrl ? (
              <li>
                <a href={contact.instagramUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  Instagram<span className="visually-hidden"> (abre em nova aba)</span>
                </a>
              </li>
            ) : null}
          </ul>
        </div>

        <div className="md:col-span-3">
          <h2 className="text-[0.8125rem] font-semibold text-paper/60">Endereço</h2>
          <address className="mt-4 text-[0.9375rem] leading-relaxed text-paper/80 not-italic">
            {address.street}
            <br />
            {address.district}, {address.region}
            <br />
            {address.city} - {address.state}, CEP {address.postalCode}
          </address>
          <a href={maps.directionsUrl} target="_blank" rel="noopener noreferrer" className={`${linkClass} mt-3 text-[0.9375rem]`}>
            Abrir rota no mapa<span className="visually-hidden"> (abre em nova aba)</span>
          </a>
        </div>
      </div>

      <div className="container-edge">
        {/* Nome da marca em escala monumental, puramente decorativo. */}
        <p aria-hidden="true" data-reveal="" className="display rv-type border-t border-paper/15 pt-6 text-[clamp(3.5rem,17.5vw,17rem)] leading-[0.9] whitespace-nowrap text-turquoise [--wght:620]">
          <span className="mask-line rv-rise">
            <span>{brand.name}</span>
          </span>
        </p>
      </div>

      <div className="container-edge flex flex-col gap-3 pt-8 pb-8 text-[0.8125rem] text-paper/65 md:flex-row md:items-center md:justify-between">
        <p>
          © {year} {brand.name}. Todos os direitos reservados.
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-1">
          <li>
            <Link href="/privacidade" className={linkClass}>
              Política de privacidade
            </Link>
          </li>
          {showDraftNotes ? <li className="py-1">Site em pré-lançamento, com fotos provisórias de banco de imagens.</li> : null}
        </ul>
      </div>
    </footer>
  );
}
