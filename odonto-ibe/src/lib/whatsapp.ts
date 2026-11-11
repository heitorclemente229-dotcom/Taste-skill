import { contact } from "@/config/site";

/** Link que abre a conversa com a clínica no WhatsApp, com a mensagem inicial preenchida. */
export function whatsappUrl(message: string = contact.whatsappMessage): string {
  return `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/** Mensagem inicial quando a pessoa vem da página de um tratamento. */
export function treatmentMessage(treatmentName: string): string {
  return `Olá! Conheci a Odonto Ibe pelo site e gostaria de saber mais sobre ${treatmentName.toLowerCase()}.`;
}
