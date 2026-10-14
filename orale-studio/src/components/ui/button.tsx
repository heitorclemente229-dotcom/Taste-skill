import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "light" | "outline";
export type ButtonSize = "md" | "sm";

const base =
  "group/btn relative inline-flex select-none items-center justify-center gap-3 whitespace-nowrap rounded-full font-medium tracking-[-0.005em] transition-[background-color,color,box-shadow,transform] duration-300 ease-out-expo active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60";

const sizes: Record<ButtonSize, string> = {
  md: "h-14 pl-6 pr-2 text-[0.95rem]",
  sm: "h-11 pl-5 pr-1.5 text-sm",
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-deep text-white shadow-[0_14px_32px_-16px_rgb(21_43_58/0.55)] hover:bg-deep-soft",
  light: "bg-white text-deep shadow-[0_14px_32px_-18px_rgb(0_0_0/0.45)] hover:bg-ice",
  outline: "bg-transparent text-deep ring-1 ring-inset ring-deep/20 hover:ring-deep/45",
};

const iconWrap: Record<ButtonVariant, string> = {
  primary: "bg-periwinkle text-white",
  light: "bg-deep text-white",
  outline: "bg-deep text-white",
};

const iconSizes: Record<ButtonSize, string> = {
  md: "size-10",
  sm: "size-8",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, sizes[size], variants[variant], className);
}

/** Conteúdo padrão de um botão: rótulo + círculo com seta que gira no hover. */
export function ButtonContent({
  children,
  variant = "primary",
  size = "md",
  icon = "arrow-up-right",
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: "arrow-up-right" | "arrow-right" | "none";
}) {
  const Icon = icon === "arrow-right" ? ArrowRight : ArrowUpRight;
  return (
    <>
      <span className="relative">{children}</span>
      {icon !== "none" ? (
        <span
          aria-hidden="true"
          className={cn(
            "grid place-items-center rounded-full transition-transform duration-500 ease-out-expo group-hover/btn:scale-105",
            iconSizes[size],
            iconWrap[variant],
          )}
        >
          <Icon
            className={cn(
              "size-[1.05rem] transition-transform duration-500 ease-out-expo",
              icon === "arrow-up-right" ? "group-hover/btn:rotate-45" : "group-hover/btn:translate-x-0.5",
            )}
            strokeWidth={1.6}
          />
        </span>
      ) : null}
    </>
  );
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: "arrow-up-right" | "arrow-right" | "none";
  className?: string;
};

export function ButtonLink({ variant = "primary", size = "md", icon, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link {...props} className={buttonClasses(variant, size, className)}>
      <ButtonContent variant={variant} size={size} icon={icon}>
        {children}
      </ButtonContent>
    </Link>
  );
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: "arrow-up-right" | "arrow-right" | "none";
};

export function Button({ variant = "primary", size = "md", icon, className, children, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} {...props} className={buttonClasses(variant, size, className)}>
      <ButtonContent variant={variant} size={size} icon={icon}>
        {children}
      </ButtonContent>
    </button>
  );
}

/** Link de texto com sublinhado que se desenha a partir da linha de referência. */
export function ArrowLink({
  className,
  children,
  tone = "deep",
  ...props
}: Omit<ComponentProps<typeof Link>, "className"> & { className?: string; tone?: "deep" | "light" }) {
  return (
    <Link
      {...props}
      className={cn(
        "group/al inline-flex items-center gap-2 py-2 text-[0.95rem] font-medium",
        tone === "deep" ? "text-deep" : "text-white",
        className,
      )}
    >
      <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:100%_1px] bg-[position:0_100%] bg-no-repeat pb-1 transition-[background-size] duration-500 ease-out-expo group-hover/al:bg-[length:0%_1px] group-focus-visible/al:bg-[length:0%_1px]">
        {children}
      </span>
      <ArrowRight
        aria-hidden="true"
        className="size-4 transition-transform duration-500 ease-out-expo group-hover/al:translate-x-1"
        strokeWidth={1.6}
      />
    </Link>
  );
}
