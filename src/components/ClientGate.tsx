"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const noop = () => () => {};

/**
 * Everything in Tally lives on the phone (localStorage) and depends on today's
 * date, so screens render only in the browser.
 */
export function ClientGate({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  return mounted ? children : null;
}
