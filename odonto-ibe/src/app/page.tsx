import { getTurnstileSiteKey } from "@/lib/contact/server/env";
import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Cta } from "@/components/sections/cta";
import { Differentials } from "@/components/sections/differentials";
import { Faq } from "@/components/sections/faq";
import { Hero } from "@/components/sections/hero";
import { Reviews } from "@/components/sections/reviews";
import { Team } from "@/components/sections/team";
import { Treatments } from "@/components/sections/treatments";

export default function HomePage() {
  // Mesma regra do servidor: o widget anti-robô só aparece quando a API exige o token.
  const turnstileSiteKey = getTurnstileSiteKey() ?? undefined;
  return (
    <>
      <Hero />
      <About />
      <Treatments />
      <Team />
      <Differentials />
      <Reviews />
      <Faq />
      <Cta />
      <Contact turnstileSiteKey={turnstileSiteKey} />
    </>
  );
}
