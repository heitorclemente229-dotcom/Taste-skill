import { hasUnconfirmedTreatments, treatments } from "@/content/treatments";
import { treatmentsSection } from "@/content/home";
import { DraftNote } from "@/components/ui/draft-note";
import { MaskHeading } from "@/components/ui/mask-heading";
import { TreatmentsList } from "./treatments-list";

/** Seção de tratamentos: cabeçalho no servidor, lista interativa no cliente. */
export function Treatments() {
  // Só o necessário atravessa para o cliente (sem os textos da página de detalhe).
  const items = treatments.map(({ slug, name, summary, photo }) => ({ slug, name, summary, photo }));
  return (
    <section id="tratamentos" aria-labelledby="tratamentos-title" className="mt-(--spacing-section) bg-mist py-(--spacing-section)">
      <div className="container-edge">
        <MaskHeading id="tratamentos-title" lines={[treatmentsSection.title]} className="text-title [--wght:570]" />
        <p data-reveal="" className="rv-fade mt-5 max-w-[52ch] text-lead text-stone">
          {treatmentsSection.lead}
        </p>
        {hasUnconfirmedTreatments ? <DraftNote className="mt-5">{treatmentsSection.draftNote}</DraftNote> : null}
      </div>
      <div className="mt-10 max-lg:bleed-right lg:container-edge lg:mt-16">
        <TreatmentsList items={items} linkLabel={treatmentsSection.linkLabel} />
      </div>
    </section>
  );
}
