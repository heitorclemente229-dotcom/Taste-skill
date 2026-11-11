"use client";

import Link from "next/link";
import { ArrowRight, Check, CircleAlert } from "lucide-react";
import { useId, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import {
  CONTACT_PREFERENCE_LABELS,
  CONTACT_PREFERENCES,
  HONEYPOT_FIELD,
  LIMITS,
  PERIOD_LABELS,
  PERIODS,
  TOPIC_LABELS,
  TOPICS,
  contactSchema,
  formatBrazilianPhone,
  normalizeBrazilianPhone,
  toFieldErrors,
  type ContactApiResponse,
  type ContactField,
  type ContactPreference,
  type FieldErrors,
  type Period,
  type Topic,
} from "@/lib/contact/schema";
import { cn } from "@/lib/cn";
import { whatsappUrl } from "@/lib/whatsapp";
import { Tooth } from "@/components/brand/tooth";
import { buttonClasses } from "@/components/ui/button";
import { TurnstileWidget } from "./turnstile-widget";

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

type ErrorCode = Exclude<ContactApiResponse, { ok: true }>["code"] | "network";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; firstName: string; channel: ContactPreference }
  | { kind: "error"; code: ErrorCode; retryAfter?: number };

/** Como a equipe vai retornar, já na forma da frase. */
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

const FIELD_ORDER: ContactField[] = ["name", "phone", "email", "contactPreference", "period", "topic", "message", "consent"];

function validate(values: FormValues): FieldErrors {
  const result = contactSchema.safeParse(values);
  const errors = result.success ? {} : toFieldErrors(result.error);
  // No esquema, esta regra só roda quando os demais campos já são válidos; aqui vale sempre.
  if (values.contactPreference === "email" && !values.email.trim() && !errors.email) {
    errors.email = "Informe um e-mail para receber o retorno por e-mail.";
  }
  return errors;
}

const inputClass =
  "peer h-12 w-full rounded-brand border border-field bg-white px-3.5 text-base text-forest transition-colors duration-300 placeholder:text-stone/70 hover:border-forest aria-invalid:border-danger";

/**
 * Formulário de contato.
 *
 * A validação do navegador usa o mesmo esquema do servidor, mas quem decide é
 * o servidor (POST /api/contato). O sucesso só aparece depois que a entrega
 * real foi confirmada; se o envio não estiver disponível, a pessoa é
 * encaminhada ao WhatsApp, sem fingir que deu certo.
 *
 * Cada estado tem um retorno visual: friso que cresce no foco, visto que
 * aparece no campo válido, erro que entra junto do campo, friso de progresso
 * no envio e o contorno do dente que se desenha no sucesso.
 */
export function ContactForm({ turnstileSiteKey }: { turnstileSiteKey?: string }) {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const [values, setValues] = useState<FormValues>(INITIAL);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<ContactField, boolean>>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);

  const ids = (field: ContactField) => ({ input: `${uid}-${field}`, error: `${uid}-${field}-erro`, hint: `${uid}-${field}-dica` });

  const update = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    const next = { ...values, [field]: value };
    setValues(next);
    const key = field as ContactField;
    if (touched[key] || errors[key]) {
      const nextErrors = validate(next);
      setErrors((current) => ({ ...current, [key]: nextErrors[key], ...(field === "contactPreference" ? { email: nextErrors.email } : {}) }));
    }
    if (status.kind === "error") setStatus({ kind: "idle" });
  };

  const blur = (field: ContactField) => {
    setTouched((current) => ({ ...current, [field]: true }));
    if (field === "phone") {
      const digits = normalizeBrazilianPhone(values.phone);
      if (digits) setValues((current) => ({ ...current, phone: formatBrazilianPhone(digits) }));
    }
    const nextErrors = validate(values);
    setErrors((current) => ({ ...current, [field]: nextErrors[field] }));
  };

  const focusField = (field: ContactField) => {
    formRef.current?.querySelector<HTMLElement>(`[data-field="${field}"]`)?.focus();
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
      const response = await fetch("/api/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({ ...values, [HONEYPOT_FIELD]: honeypot, ...(turnstileToken ? { turnstileToken } : {}) }),
      });
      let data: ContactApiResponse | null = null;
      try {
        data = (await response.json()) as ContactApiResponse;
      } catch {
        data = null;
      }

      if (response.ok && data?.ok) {
        const firstName = values.name.trim().split(/\s+/)[0] ?? "";
        setStatus({ kind: "success", firstName, channel: values.contactPreference });
        setValues(INITIAL);
        setTouched({});
        setErrors({});
        window.requestAnimationFrame(() => successRef.current?.focus());
        return;
      }

      if (data && !data.ok) {
        if (data.code === "invalid" && data.fieldErrors) {
          const fieldErrors = data.fieldErrors;
          setErrors(fieldErrors);
          const serverInvalid = FIELD_ORDER.find((field) => fieldErrors[field]);
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
      <div role="status" data-load="" className="flex flex-col items-start py-4">
        <span className="relative grid h-24 w-20 place-items-center text-teal">
          <Tooth className="absolute inset-0 h-full w-full" strokeWidth={2.4} pathClassName="rv-draw [--draw-duration:1.1s]" />
          <Check aria-hidden="true" size={26} strokeWidth={2} className="rv-fade [--d:700ms]" />
        </span>
        <h3 ref={successRef} tabIndex={-1} className="display rv-fade mt-6 text-heading outline-none [--d:200ms] [--wght:600]">
          Mensagem enviada{status.firstName ? `, ${status.firstName}` : ""}.
        </h3>
        <p className="rv-fade mt-3 max-w-[44ch] leading-relaxed text-stone [--d:320ms]">
          A equipe da Odonto Ibe vai retornar {RETURN_CHANNEL[status.channel]} assim que possível. Este envio ainda não reserva um horário.
        </p>
        <button type="button" onClick={() => setStatus({ kind: "idle" })} className={cn(buttonClasses("outline"), "rv-fade mt-7 [--d:440ms]")}>
          Enviar outra mensagem
        </button>
      </div>
    );
  }

  const submitting = status.kind === "submitting";
  const isValid = (field: ContactField) => Boolean(touched[field]) && !errors[field] && String(values[field]).trim() !== "";

  return (
    // method="post": mesmo sem JavaScript, nenhum dado pessoal vai para a URL.
    <form ref={formRef} method="post" noValidate onSubmit={onSubmit} aria-busy={submitting} className="flex flex-col gap-6">
      <noscript>
        <p className="rounded-brand bg-turquoise-wash px-4 py-3 text-[0.9375rem] leading-relaxed">
          Para enviar pelo site, ative o JavaScript do navegador. Você também pode falar com a clínica pelo WhatsApp (11) 97655-6438.
        </p>
      </noscript>

      <StatusMessage status={status} statusRef={statusRef} />

      <Field label="Nome" ids={ids("name")} error={errors.name} valid={isValid("name")}>
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

      <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
        <Field label="Telefone ou WhatsApp" ids={ids("phone")} error={errors.phone} hint="Com DDD." valid={isValid("phone")}>
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
        <Field label="E-mail" optional={values.contactPreference !== "email"} ids={ids("email")} error={errors.email} valid={isValid("email")}>
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

      <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
        <ChoiceGroup
          legend="Como prefere o retorno?"
          name="contactPreference"
          options={CONTACT_PREFERENCES.map((value) => ({ value, label: CONTACT_PREFERENCE_LABELS[value] }))}
          value={values.contactPreference}
          onChange={(value) => update("contactPreference", value)}
          error={errors.contactPreference}
          errorId={ids("contactPreference").error}
        />
        <ChoiceGroup
          legend="Melhor período"
          name="period"
          options={PERIODS.map((value) => ({ value, label: PERIOD_LABELS[value] }))}
          value={values.period}
          onChange={(value) => update("period", value)}
          error={errors.period}
          errorId={ids("period").error}
        />
      </div>

      <Field label="Assunto" optional ids={ids("topic")} error={errors.topic}>
        <select
          id={ids("topic").input}
          data-field="topic"
          name="topic"
          value={values.topic}
          onChange={(event) => update("topic", event.target.value as Topic | "")}
          onBlur={() => blur("topic")}
          aria-invalid={Boolean(errors.topic)}
          aria-describedby={errors.topic ? ids("topic").error : undefined}
          className={cn(inputClass, "appearance-none bg-[linear-gradient(45deg,transparent_50%,var(--color-forest)_50%),linear-gradient(135deg,var(--color-forest)_50%,transparent_50%)] bg-[length:6px_6px,6px_6px] bg-[position:calc(100%-1.25rem)_55%,calc(100%-0.875rem)_55%] bg-no-repeat pr-10")}
        >
          <option value="">Selecione</option>
          {TOPICS.map((topic) => (
            <option key={topic} value={topic}>
              {TOPIC_LABELS[topic]}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Mensagem"
        optional
        ids={ids("message")}
        error={errors.message}
        hint="Não inclua informações de saúde. Conversamos sobre isso na consulta."
        counter={`${values.message.length}/${LIMITS.messageMax}`}
      >
        <textarea
          id={ids("message").input}
          data-field="message"
          name="message"
          rows={4}
          maxLength={LIMITS.messageMax}
          value={values.message}
          onChange={(event) => update("message", event.target.value)}
          onBlur={() => blur("message")}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={cn(ids("message").hint, errors.message && ids("message").error)}
          className={cn(inputClass, "h-auto min-h-28 resize-y py-3 leading-relaxed")}
        />
      </Field>

      {/* Campo-armadilha: invisível para pessoas, costuma ser preenchido por robôs. */}
      <div aria-hidden="true" className="visually-hidden">
        <label>
          Não preencha este campo
          <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
        </label>
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem] leading-relaxed">
          <input
            data-field="consent"
            name="consent"
            type="checkbox"
            required
            checked={values.consent}
            onChange={(event) => update("consent", event.target.checked)}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? ids("consent").error : undefined}
            className="peer visually-hidden"
          />
          <span
            aria-hidden="true"
            className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-brand border border-field bg-white text-paper transition-colors duration-300 peer-checked:border-forest peer-checked:bg-forest peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal peer-aria-invalid:border-danger [&>svg]:scale-0 [&>svg]:transition-transform [&>svg]:duration-300 [&>svg]:ease-out-expo peer-checked:[&>svg]:scale-100"
          >
            <Check size={14} strokeWidth={3} />
          </span>
          <span>
            Li a{" "}
            <Link href="/privacidade" className="font-semibold text-teal underline underline-offset-4">
              política de privacidade
            </Link>{" "}
            e autorizo o uso dos meus dados para o retorno deste contato.
          </span>
        </label>
        <FieldError id={ids("consent").error} message={errors.consent} />
      </div>

      {turnstileSiteKey ? <TurnstileWidget siteKey={turnstileSiteKey} onToken={setTurnstileToken} resetSignal={turnstileReset} /> : null}

      <div>
        <button type="submit" disabled={submitting} className={cn(buttonClasses("solid", "lg"), "w-full disabled:cursor-wait sm:w-auto")}>
          <span>{submitting ? "Enviando" : "Enviar mensagem"}</span>
          <ArrowRight aria-hidden="true" size={18} strokeWidth={1.75} className="transition-transform duration-500 ease-out-expo group-hover/btn:translate-x-1" />
          {/* Friso de progresso enquanto o envio acontece. */}
          {submitting ? <span aria-hidden="true" className="progress-sweep absolute inset-x-0 bottom-0 h-0.5 bg-turquoise" /> : null}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  ids,
  error,
  hint,
  optional,
  valid,
  counter,
  children,
}: {
  label: string;
  ids: { input: string; error: string; hint: string };
  error?: string;
  hint?: string;
  optional?: boolean;
  valid?: boolean;
  counter?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={ids.input} className="flex items-baseline justify-between gap-3 text-[0.9375rem] font-semibold">
        <span>
          {label}
          {optional ? <span className="font-normal text-stone"> (opcional)</span> : null}
        </span>
        {counter ? <span className="tabular text-[0.8125rem] font-normal text-stone">{counter}</span> : null}
      </label>
      <div className="relative">
        {children}
        {/* Friso de foco: cresce da esquerda quando o campo recebe foco. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-teal transition-transform duration-500 ease-friso peer-focus:scale-x-100" />
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-3.5 right-3.5 text-teal transition-[opacity,scale] duration-500 ease-out-expo",
            valid ? "scale-100 opacity-100" : "scale-50 opacity-0",
          )}
        >
          <Check size={18} strokeWidth={2.25} />
        </span>
      </div>
      {hint ? (
        <p id={ids.hint} className="text-[0.8125rem] leading-snug text-stone">
          {hint}
        </p>
      ) : null}
      <FieldError id={ids.error} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="flex animate-[fade-up_0.4s_var(--ease-out-expo)_both] items-start gap-1.5 text-[0.875rem] leading-snug text-danger">
      <CircleAlert aria-hidden="true" size={16} strokeWidth={1.75} className="mt-px shrink-0" />
      {message}
    </p>
  );
}

function ChoiceGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  error,
  errorId,
}: {
  legend: string;
  name: ContactField;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  error?: string;
  errorId: string;
}) {
  return (
    <fieldset aria-describedby={error ? errorId : undefined} className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-[0.9375rem] font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              data-field={index === 0 ? name : undefined}
              className="peer visually-hidden"
            />
            <span className="inline-flex min-h-11 items-center rounded-brand border border-field bg-white px-3.5 text-[0.9375rem] font-medium transition-colors duration-300 peer-checked:border-forest peer-checked:bg-forest peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal hover:border-forest">
              {option.label}
            </span>
          </label>
        ))}
      </div>
      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}

function StatusMessage({ status, statusRef }: { status: Status; statusRef: RefObject<HTMLDivElement | null> }) {
  if (status.kind !== "error") return <div ref={statusRef} tabIndex={-1} className="hidden" />;
  const minutes = status.retryAfter ? Math.max(1, Math.ceil(status.retryAfter / 60)) : null;
  const whatsapp = (
    <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
      fale com a clínica pelo WhatsApp
    </a>
  );
  let message: ReactNode;
  switch (status.code) {
    case "invalid":
      message = "Revise os campos destacados e envie de novo.";
      break;
    case "rate_limited":
      message = (
        <>
          Muitas tentativas em pouco tempo. Aguarde {minutes ? `${minutes} min` : "alguns minutos"} e tente de novo, ou {whatsapp}.
        </>
      );
      break;
    case "verification_failed":
      message = "Confirme a verificação anti-robô e envie de novo.";
      break;
    case "network":
      message = <>Não foi possível conectar. Confira sua internet e tente de novo, ou {whatsapp}.</>;
      break;
    case "unavailable":
      message = <>O envio pelo site está indisponível no momento. Por favor, {whatsapp}.</>;
      break;
    default:
      message = <>Não foi possível enviar agora. Tente de novo em instantes ou {whatsapp}.</>;
  }
  return (
    <div
      ref={statusRef}
      tabIndex={-1}
      role="alert"
      className="flex animate-[fade-up_0.5s_var(--ease-out-expo)_both] items-start gap-3 rounded-brand border border-danger/40 bg-white px-4 py-3.5 text-[0.9375rem] leading-relaxed outline-none"
    >
      <CircleAlert aria-hidden="true" size={19} strokeWidth={1.75} className="mt-0.5 shrink-0 text-danger" />
      <p>{message}</p>
    </div>
  );
}
