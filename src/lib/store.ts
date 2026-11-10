"use client";

import { useSyncExternalStore } from "react";
import type { Draft, Entry } from "./types";

const KEY = "tally.entries.v1";
const listeners = new Set<() => void>();
const EMPTY: Entry[] = [];
let cache: Entry[] | null = null;

function read(): Entry[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Entry[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(entries: Entry[]) {
  cache = entries;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // Storage full or blocked: keep the in-memory copy so the session still works.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** All entries, newest first. Empty during server render. */
export function useEntries(): Entry[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function addEntry(draft: Draft, createdAt = new Date().toISOString()): Entry {
  const entry: Entry = { ...draft, id: crypto.randomUUID(), createdAt };
  write([entry, ...read()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  return entry;
}

export function replaceAll(entries: Entry[]) {
  write([...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export function clearAll() {
  write([]);
}

/** Hand a draft from the record screen to the confirm step without a URL. */
const DRAFT_KEY = "tally.pendingDraft";
export function stashDraft(d: Draft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
}
export function takeDraft(): Draft | null {
  const raw = sessionStorage.getItem(DRAFT_KEY);
  sessionStorage.removeItem(DRAFT_KEY);
  return raw ? (JSON.parse(raw) as Draft) : null;
}
