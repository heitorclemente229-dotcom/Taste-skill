"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Check, CircleAlert, CircleCheck, Phone } from "lucide-react";
import { useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode, type RefObject } from "react";
import { booking, contact } from "@/config/site";
import {
  CONTACT_PREFERENCE_LABELS,
  CONTACT_PREFERENCES,
  HONEYPOT_FIELD,
  LIMITS,
  PERIOD_LABELS,
  PERIODS,
  TOPIC_LABELS,
  TOPICS,
  bookingSchema,
  formatBrazilianPhone,
  normalizeBrazilianPhone,
  toFieldErrors,
  type BookingApiResponse,
  type BookingField,
  type ContactPreference,
  type FieldErrors,
  type Period,
  type Topic,
} from "@/lib/booking/schema";
import { cn } from "@/lib/cn";
import { Button, ButtonContent, buttonClasses } from "@/components/ui/button";
import { EASE_OUT, useReduced } from "@/components/motion/primitives";
import { TurnstileWidget } from "@/components/booking/turnstile-widget";

type FormValues = {
  name: string;
  phone: string;
  email: string;
  contactPreference: ContactPreference;
  period: Period;
  topic: Topic | "";
  message: string;
  consent: boolean;
};

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; firstName: string; channel: ContactPreference }
  | { kind: "error"; code: Exclude<BookingApiResponse, { ok: true }>["code"] | "network"; retryAfter?: number };

/** Como a equipe vai retornar, já na forma da frase ("pelo WhatsApp", "por e-mail"). */
const RETURN_CHANNEL: Record<ContactPreference, string> = {
  whatsapp: "pelo WhatsApp",
  ligacao: "por telefone",
  email: "por e-mail",
};

const INITIAL: FormValues = {
  name: "",
  phone: "",
  email: "",
  contactPreference: "whatsapp",
  period: "indiferente",
  topic: "",
  message: "",
  consent: false,
};

const FIELD_ORDER: BookingField[] = ["name", "phone", "email", "contactPreference", "period", "topic", "message", "consent"];

function validate(values: FormValues): FieldErrors {
  const result = bookingSchema.safeParse(values);
  const errors = result.success ? {} : toFieldErrors(result.error);
  // A regra "e-mail obrigatório quando o retorno é por e-mail" só roda no
  // esquema quando os demais campos já são válidos; aqui ela vale sempre.
  if (values.contactPreference === "email" && !values.email.trim() && !errors.email) {
    errors.email = "Informe um e-mail para receber o retorno por e-mail.";
  }
  return errors;
}

export function BookingForm({
  context,
  defaultTopic,
  turnstileSiteKey,
  onDismiss,
}: {
  context: "dialog" | "page";
  defaultTopic?: Topic;
  turnstileSiteKey?: string;
  onDismiss?: () => void;
}) {
  const uid = useId();
  const reduce = useReduced();
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const [values, setValues] = useState<FormValues>({ ...INITIAL, topic: defaultTopic ?? "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<BookingField, boolean>>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);

  const ids = (field: BookingField) => ({ input: `${uid}-${field}`, error: `${uid}-${field}-erro`, hint: `${uid}-${field}-dica` });

  const update = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    const next = { ...values, [field]: value };
    setValues(next);
    if (touched[field as BookingField] || errors[field as BookingField]) {
      const nextErrors = validate(next);
      setErrors((current) => ({ ...current, [field]: nextErrors[field as BookingField], ...(field === "contactPreference" ? { email: nextErrors.email } : {}) }));
    }
    if (status.kind === "error") setStatus({ kind: "idle" });
  };

  const blur = (field: BookingField) => {
    setTouched((current) => ({ ...current, [field]: true }));
    if (field === "phone") {
      const digits = normalizeBrazilianPhone(values.phone);
      if (digits) setValues((current) => ({ ...current, phone: formatBrazilianPhone(digits) }));
    }
    const nextErrors = validate(values);
    setErrors((current) => ({ ...current, [field]: nextErrors[field] }));
  };

  const focusField = (field: BookingField) => {
    const element = formRef.current?.querySelector<HTMLElement>(`[data-field="${field}"]`);
    element?.focus();
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status.kind === "submitting") return;

    const nextErrors = validate(values);
    setErrors(nextErrors);
    setTouched(Object.fromEntries(FIELD_ORDER.map((field) => [field, true])));
    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstInvalid) {
      setStatus({ kind: "error", code: "invalid" });
      focusField(firstInvalid);
      return;
    }
    if (turnstileSiteKey && !turnstileToken) {
      setStatus({ kind: "error", code: "verification_failed" });
      return;
    }

    setStatus({ kind: "submitting" });
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/agendamento", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({
          ...values,
          [HONEYPOT_FIELD]: honeypot,
          ...(turnstileToken ? { turnstileToken } : {}),
        }),
      });
      let data: BookingApiResponse | null = null;
      try {
        data = (await response.json()) as BookingApiResponse;
      } catch {
        data = null;
      }

      if (response.ok && data?.ok) {
        const firstName = values.name.trim().split(/\s+/)[0] ?? "";
        setStatus({ kind: "success", firstName, channel: values.contactPreference });
        setValues({ ...INITIAL });
        setTouched({});
        setErrors({});
        window.requestAnimationFrame(() => successRef.current?.focus());
        return;
      }

      if (data && !data.ok) {
        if (data.code === "invalid" && data.fieldErrors) {
          setErrors(data.fieldErrors);
          const serverInvalid = FIELD_ORDER.find((field) => data.fieldErrors?.[field]);
          if (serverInvalid) focusField(serverInvalid);
        }
        setStatus({ kind: "error", code: data.code, retryAfter: data.retryAfter });
      } else {
        setStatus({ kind: "error", code: response.status === 429 ? "rate_limited" : "error" });
      }
    } catch {
      setStatus({ kind: "error", code: "network" });
    } finally {
      window.clearTimeout(timeout);
      if (turnstileSiteKey) {
        setTurnstileToken(null);
        setTurnstileReset((value) => value + 1);
      }
    }
    window.requestAnimationFrame(() => statusRef.current?.focus());
  };

  if (status.kind === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.7, ease: EASE_OUT }}
        className="flex flex-col items-start gap-6 py-6"
        role="status"
      >
        <span className="grid size-14 place-items-center rounded-full bg-ice text-accent-ink">
          <CircleCheck className="size-7" strokeWidth={1.5} aria-hidden="true" />
        </span>
        <h3 ref={successRef} tabIndex={-1} className="text-[1.75rem] font-light leading-tight tracking-[-0.03em] outline-none">
          Solicitação enviada{status.firstName ? `, ${status.firstName}` : ""}.
        </h3>
        <p className="max-w-[40ch] leading-relaxed text-slate">
          Nossa equipe vai entrar em contato {RETURN_CHANNEL[status.channel]} para confirmar data e horário. Este envio
          ainda não reserva um horário.
        </p>
        {context === "dialog" ? (
          <Button variant="outline" icon="none" onClick={onDismiss}>
            Fechar
          </Button>
        ) : (
          <Link href="/" className="text-[0.95rem] font-medium text-deep underline decoration-deep/30 underline-offset-4 hover:decoration-deep">
            Voltar para a página inicial
          </Link>
        )}
      </motion.div>
    );
  }

  const submitting = status.kind === "submitting";
  const messageLength = values.message.length;

  return (
    // method="post": mesmo sem JavaScript, nenhum dado pessoal vai para a URL.
    <form ref={formRef} method="post" noValidate onSubmit={onSubmit} aria-busy={submitting} className="flex flex-col gap-7">
      <noscript>
        <p className="rounded-surface bg-ice px-5 py-4 text-[0.95rem] leading-relaxed text-deep">
          Para enviar pelo site, ative o JavaScript do navegador. Você também pode falar com a clínica pelo WhatsApp{" "}
          {contact.whatsapp.display} ou pelo telefone {contact.phone.display}.
        </p>
      </noscript>
      {booking.externalUrl ? (
        <p className="rounded-surface bg-ice px-5 py-4 text-[0.95rem] leading-relaxed text-deep">
          Prefere escolher o horário agora?{" "}
          <a href={booking.externalUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4">
            Agendar online
          </a>
        </p>
      ) : null}

      <StatusMessage status={status} statusRef={statusRef} />

      <Field label="Nome completo" ids={ids("name")} error={errors.name}>
        <input
          id={ids("name").input}
          data-field="name"
          name="name"
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          maxLength={LIMITS.nameMax}
          required
          value={values.name}
          onChange={(event) => update("name", event.target.value)}
          onBlur={() => blur("name")}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? ids("name").error : undefined}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-7 sm:grid-cols-2 sm:gap-5">
        <Field label="Telefone ou WhatsApp" ids={ids("phone")} error={errors.phone} hint="Com DDD.">
          <input
            id={ids("phone").input}
            data-field="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            maxLength={20}
            required
            placeholder="(11) 91234-5678"
            value={values.phone}
            onChange={(event) => update("phone", event.target.value)}
            onBlur={() => blur("phone")}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={cn(ids("phone").hint, errors.phone && ids("phone").error)}
            className={inputClass}
          />
        </Field>
        <Field
          label="E-mail"
          optional={values.contactPreference !== "email"}
          ids={ids("email")}
          error={errors.email}
        >
          <input
            id={ids("email").input}
            data-field="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={LIMITS.emailMax}
            required={values.contactPreference === "email"}
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            onBlur={() => blur("email")}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? ids("email").error : undefined}
            className={inputClass}
          />
        </Field>
      </div>

      <ChoiceGroup
        legend="Como prefere o retorno?"
        name="contactPreference"
        options={CONTACT_PREFERENCES.map((value) => ({ value, label: CONTACT_PREFERENCE_LABELS[value] }))}
        value={values.contactPreference}
        onChange={(value) => update("contactPreference", value as ContactPreference)}
        error={errors.contactPreference}
        uid={uid}
      />

      <ChoiceGroup
        legend="Melhor período"
        name="period"
        options={PERIODS.map((value) => ({ value, label: PERIOD_LABELS[value] }))}
        value={values.period}
        onChange={(value) => update("period", value as Period)}
        error={errors.period}
        uid={uid}
      />

      <Field label="Assunto" optional ids={ids("topic")} error={errors.topic}>
        <div className="relative">
          <select
            id={ids("topic").input}
            data-field="topic"
            name="topic"
            value={values.topic}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => update("topic", event.target.value as Topic | "")}
            onBlur={() => blur("topic")}
            aria-invalid={Boolean(errors.topic)}
            aria-describedby={errors.topic ? ids("topic").error : undefined}
            className={cn(inputClass, "appearance-none pr-12")}
          >
            <option value="">Selecione, se quiser</option>
            {TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {TOPIC_LABELS[topic]}
              </option>
            ))}
          </select>
          <svg aria-hidden="true" viewBox="0 0 16 16" className="pointer-events-none absolute right-5 top-1/2 size-3.5 -translate-y-1/2 fill-none stroke-deep" strokeWidth={1.5}>
            <path d="M3 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </Field>

      <Field
        label="Mensagem"
        optional
        ids={ids("message")}
        error={errors.message}
        hint="Não inclua informações de saúde. Detalhes clínicos são tratados na consulta."
        counter={`${messageLength}/${LIMITS.messageMax}`}
      >
        <textarea
          id={ids("message").input}
          data-field="message"
          name="message"
          rows={3}
          maxLength={LIMITS.messageMax}
          value={values.message}
          onChange={(event) => update("message", event.target.value)}
          onBlur={() => blur("message")}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={cn(ids("message").hint, errors.message && ids("message").error)}
          className={cn(inputClass, "min-h-28 resize-y leading-relaxed")}
        />
      </Field>

      {/* Campo-armadilha: invisível para pessoas e leitores de tela. */}
      <div aria-hidden="true" className="visually-hidden">
        <label htmlFor={`${uid}-hp`}>Não preencha este campo</label>
        <input
          id={`${uid}-hp`}
          type="text"
          name={HONEYPOT_FIELD}
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={ids("consent").input} className="group/consent flex cursor-pointer items-start gap-3.5">
          <input
            id={ids("consent").input}
            data-field="consent"
            name="consent"
            type="checkbox"
            checked={values.consent}
            onChange={(event) => {
              update("consent", event.target.checked);
              setTouched((current) => ({ ...current, consent: true }));
            }}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? ids("consent").error : undefined}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-[0.5rem] border border-field bg-white text-white transition-[background-color,border-color] duration-200 peer-checked:border-deep peer-checked:bg-deep peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-accent-ink peer-aria-[invalid=true]:border-danger"
          >
            <Check className={cn("size-4 transition-opacity", values.consent ? "opacity-100" : "opacity-0")} strokeWidth={2.25} />
          </span>
          <span className="text-[0.95rem] leading-relaxed text-deep">
            Li o{" "}
            <a
              href="/privacidade"
              target="_blank"
              rel="noopener"
              className="font-medium underline decoration-deep/30 underline-offset-4 hover:decoration-deep"
            >
              aviso de privacidade
            </a>{" "}
            e concordo com o uso destes dados para o retorno desta solicitação.
          </span>
        </label>
        <FieldError id={ids("consent").error} message={errors.consent} />
      </div>

      {turnstileSiteKey ? (
        <TurnstileWidget siteKey={turnstileSiteKey} onToken={setTurnstileToken} resetSignal={turnstileReset} />
      ) : null}

      <div className="flex flex-col gap-4 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className={buttonClasses("primary", "md", "w-full sm:w-auto sm:self-start")}
        >
          <ButtonContent icon={submitting ? "none" : "arrow-right"}>
            {submitting ? "Enviando solicitação" : "Enviar solicitação"}
          </ButtonContent>
          {submitting ? <ProgressLine /> : null}
        </button>
        <p className="max-w-[46ch] text-sm leading-relaxed text-slate">
          Usamos seus dados somente para responder a esta solicitação. O envio não confirma um horário: a confirmação
          acontece no retorno da equipe.
        </p>
      </div>
    </form>
  );
}

const inputClass =
  "block w-full rounded-field border border-field bg-white px-4 py-3.5 text-base text-deep placeholder:text-slate transition-[border-color,box-shadow] duration-200 hover:border-deep/60 focus:border-accent-ink focus:shadow-[0_0_0_4px_rgb(117_140_240/0.22)] focus:outline-none aria-[invalid=true]:border-danger aria-[invalid=true]:focus:shadow-[0_0_0_4px_rgb(180_35_24/0.14)]";

function Field({
  label,
  optional = false,
  ids,
  error,
  hint,
  counter,
  children,
}: {
  label: string;
  optional?: boolean;
  ids: { input: string; error: string; hint: string };
  error?: string;
  hint?: string;
  counter?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={ids.input} className="text-[0.95rem] font-medium text-deep">
          {label}
          {optional ? <span className="font-normal text-slate"> (opcional)</span> : null}
        </label>
        {counter ? (
          <span className="tabular text-xs text-slate" aria-hidden="true">
            {counter}
          </span>
        ) : null}
      </div>
      {children}
      {hint ? (
        <p id={ids.hint} className="text-sm leading-relaxed text-slate">
          {hint}
        </p>
      ) : null}
      <FieldError id={ids.error} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message ? (
        <motion.p
          key={message}
          id={id}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-start gap-1.5 text-sm leading-snug text-danger"
        >
          <CircleAlert className="mt-px size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span>{message}</span>
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}

function ChoiceGroup({
  legend,
  name,
  options,
  value,
  onChange,
  error,
  uid,
}: {
  legend: string;
  name: BookingField;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  uid: string;
}) {
  const errorId = `${uid}-${name}-erro`;
  return (
    <fieldset className="flex flex-col gap-2.5" aria-describedby={error ? errorId : undefined}>
      <legend className="mb-2.5 text-[0.95rem] font-medium text-deep">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => (
          <label
            key={option.value}
            className={cn(
              "relative inline-flex h-11 cursor-pointer items-center rounded-full px-5 text-[0.95rem] ring-1 ring-inset transition-[background-color,color,box-shadow] duration-300 ease-out-expo has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-accent-ink",
              value === option.value ? "bg-deep text-white ring-deep" : "bg-white text-deep ring-field/70 hover:ring-deep/60",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
              data-field={index === 0 ? name : undefined}
            />
            {option.label}
          </label>
        ))}
      </div>
      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}

function ProgressLine() {
  return (
    <span aria-hidden="true" className="absolute inset-x-6 bottom-2 h-px overflow-hidden rounded-full bg-white/20">
      <motion.span
        className="absolute inset-y-0 left-0 w-1/3 bg-white/80"
        initial={{ x: "-100%" }}
        animate={{ x: "300%" }}
        transition={{ duration: 1.1, repeat: Infinity, ease: [0.65, 0, 0.35, 1] }}
      />
    </span>
  );
}

function StatusMessage({ status, statusRef }: { status: Status; statusRef: RefObject<HTMLDivElement | null> }) {
  const message = status.kind === "error" ? errorCopy(status.code, status.retryAfter) : null;
  const showChannels = status.kind === "error" && ["unavailable", "delivery_failed", "error", "network"].includes(status.code);
  return (
    <div ref={statusRef} tabIndex={-1} aria-live="polite" className="outline-none empty:hidden">
      {message ? (
        <div className="flex flex-col gap-3 rounded-surface border border-danger/25 bg-white px-5 py-4">
          <p className="flex items-start gap-2 text-[0.95rem] leading-relaxed text-danger">
            <CircleAlert className="mt-0.5 size-[1.1rem] shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>{message}</span>
          </p>
          {showChannels ? (
            <p className="flex flex-wrap items-center gap-x-5 gap-y-2 pl-7 text-[0.95rem] text-deep">
              <a href={contact.whatsapp.href} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4">
                WhatsApp {contact.whatsapp.display}
              </a>
              <a href={contact.phone.href} className="inline-flex items-center gap-1.5 font-medium underline underline-offset-4">
                <Phone className="size-4" strokeWidth={1.6} aria-hidden="true" />
                {contact.phone.display}
              </a>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function errorCopy(code: Exclude<Status, { kind: "idle" | "submitting" | "success" }>["code"], retryAfter?: number): string {
  switch (code) {
    case "invalid":
      return "Revise os campos destacados para continuar.";
    case "rate_limited": {
      const minutes = retryAfter ? Math.max(1, Math.ceil(retryAfter / 60)) : null;
      return minutes
        ? `Muitas tentativas em pouco tempo. Tente novamente em ${minutes} ${minutes === 1 ? "minuto" : "minutos"}.`
        : "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
    }
    case "verification_failed":
      return "Não foi possível confirmar o envio. Conclua a verificação e tente novamente.";
    case "unavailable":
      return "O envio online está indisponível no momento. Fale com a clínica pelos canais abaixo.";
    case "forbidden":
    case "invalid_request":
      return "Não foi possível processar o envio. Atualize a página e tente novamente.";
    case "network":
      return "Sem conexão com o servidor. Verifique sua internet e tente novamente, ou fale conosco pelos canais abaixo.";
    case "delivery_failed":
    case "error":
    default:
      return "Não foi possível enviar agora. Tente novamente em instantes ou fale conosco pelos canais abaixo.";
  }
}
