import { MessageCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { whatsappUrl } from "@/lib/whatsapp";
import { ButtonLink } from "./button";

type Props = {
  label: string;
  /** Mensagem inicial da conversa. Padrão: a mensagem definida no briefing. */
  message?: string;
} & Pick<ComponentProps<typeof ButtonLink>, "variant" | "size" | "className">;

/** Botão que abre a conversa da clínica no WhatsApp com a mensagem inicial. */
export function WhatsAppLink({ label, message, variant = "solid", size = "md", className }: Props) {
  return (
    <ButtonLink
      href={whatsappUrl(message)}
      variant={variant}
      size={size}
      className={className}
      data-whatsapp=""
      leading={<MessageCircle aria-hidden="true" size={18} strokeWidth={1.75} />}
    >
      {label}
    </ButtonLink>
  );
}
