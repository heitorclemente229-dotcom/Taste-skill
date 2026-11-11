import { Clock, MapPin, Navigation, Phone } from "lucide-react";
import { address, brand, contact, maps, openingHours } from "@/config/site";
import { contactSection } from "@/content/home";
import { ContactForm } from "@/components/contact/contact-form";
import { MapEmbed } from "@/components/contact/map-embed";
import { ButtonLink } from "@/components/ui/button";
import { DraftNote } from "@/components/ui/draft-note";
import { MaskHeading } from "@/components/ui/mask-heading";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";

/** Localização, contato e formulário. */
export function Contact({ turnstileSiteKey }: { turnstileSiteKey?: string }) {
  return (
    <section id="contato" data-dock-hide="" aria-labelledby="contato-title" className="py-(--spacing-section)">
      <div className="container-edge">
        <MaskHeading id="contato-title" lines={[contactSection.title]} className="text-title [--wght:570]" />

        <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-10 lg:mt-16 lg:grid-cols-12">
          <div data-reveal="" className="lg:col-span-5">
            <p className="rv-fade display text-heading [--wght:600]">
              {brand.name}
              <span className="block text-[0.65em] text-stone [--wght:440]">{brand.descriptor}</span>
            </p>

            <dl className="rv-fade mt-8 space-y-6 [--i:1]">
              <div className="flex gap-4">
                <dt>
                  <MapPin aria-hidden="true" size={20} strokeWidth={1.75} className="mt-0.5 text-teal" />
                  <span className="visually-hidden">Endereço</span>
                </dt>
                <dd>
                  <address className="leading-relaxed not-italic">
                    {address.street}
                    <br />
                    {address.district}, {address.region}
                    <br />
                    {address.city} - {address.state}, CEP {address.postalCode}
                  </address>
                </dd>
              </div>
              <div className="flex gap-4">
                <dt>
                  <Phone aria-hidden="true" size={20} strokeWidth={1.75} className="mt-0.5 text-teal" />
                  <span className="visually-hidden">Telefone e WhatsApp</span>
                </dt>
                <dd>
                  <a href={contact.phoneHref} className="tabular font-semibold underline decoration-turquoise decoration-2 underline-offset-4">
                    {contact.phoneDisplay}
                  </a>
                  <span className="block text-[0.9375rem] text-stone">Telefone e WhatsApp</span>
                </dd>
              </div>
              <div className="flex gap-4">
                <dt>
                  <Clock aria-hidden="true" size={20} strokeWidth={1.75} className="mt-0.5 text-teal" />
                  <span className="visually-hidden">Horários</span>
                </dt>
                <dd>
                  {openingHours ? (
                    <ul className="space-y-1">
                      {openingHours.map((entry) => (
                        <li key={entry.days}>
                          <span className="font-semibold">{entry.days}</span>: {entry.hours}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <>
                      <p className="leading-relaxed">{contactSection.hoursPending}</p>
                      <DraftNote className="mt-2">Os horários entram aqui depois de confirmados por completo.</DraftNote>
                    </>
                  )}
                </dd>
              </div>
            </dl>

            <div className="rv-fade mt-9 flex flex-col gap-3 sm:flex-row [--i:2]">
              <ButtonLink href={maps.directionsUrl} variant="accent" size="lg" leading={<Navigation aria-hidden="true" size={18} strokeWidth={1.75} />}>
                {contactSection.routeButton}
              </ButtonLink>
              <WhatsAppLink label={contactSection.whatsappButton} variant="outline" size="lg" />
            </div>
          </div>

          <div data-reveal="" className="lg:col-span-7">
            <div className="rv-fade h-[22rem] overflow-hidden rounded-brand lg:h-full lg:min-h-[28rem]">
              <MapEmbed />
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-8 border-t border-forest/15 pt-12 lg:mt-24 lg:grid-cols-12 lg:pt-16">
          <div data-reveal="" className="lg:col-span-4">
            <h3 className="rv-fade display max-w-[16ch] text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.08] [--wght:580]">{contactSection.formTitle}</h3>
            <p className="rv-fade mt-4 max-w-[36ch] leading-relaxed text-stone [--i:1]">{contactSection.formLead}</p>
          </div>
          <div className="rounded-brand bg-mist p-5 sm:p-8 lg:col-span-7 lg:col-start-6 lg:p-10">
            <ContactForm turnstileSiteKey={turnstileSiteKey} />
          </div>
        </div>
      </div>
    </section>
  );
}
