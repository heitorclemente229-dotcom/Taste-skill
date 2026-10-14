"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { BookingProvider } from "@/components/booking/booking-context";

export function Providers({ children, turnstileSiteKey }: { children: ReactNode; turnstileSiteKey?: string }) {
  return (
    // reducedMotion="user": transformações viram instantâneas para quem pede menos movimento.
    <MotionConfig reducedMotion="user">
      <BookingProvider turnstileSiteKey={turnstileSiteKey}>{children}</BookingProvider>
    </MotionConfig>
  );
}
