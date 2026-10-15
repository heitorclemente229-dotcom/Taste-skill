import { Hero } from "@/components/sections/hero";
import { Manifesto } from "@/components/sections/manifesto";
import { Treatments } from "@/components/sections/treatments";
import { Experience } from "@/components/sections/experience";
import { Team } from "@/components/sections/team";
import { Process } from "@/components/sections/process";
import { Testimonials } from "@/components/sections/testimonials";
import { FinalCta } from "@/components/sections/final-cta";
import { DentistJsonLd } from "@/components/seo/json-ld";

export default function HomePage() {
  return (
    <>
      {/* Dados estruturados da clínica; não renderiza nada enquanto os dados forem placeholders. */}
      <DentistJsonLd />
      <Hero />
      <Manifesto />
      <Treatments />
      <Experience />
      <Team />
      <Process />
      <Testimonials />
      <FinalCta />
    </>
  );
}
