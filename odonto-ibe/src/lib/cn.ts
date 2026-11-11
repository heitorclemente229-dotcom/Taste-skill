/** Junta classes condicionais. Evite passar classes conflitantes do Tailwind. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
