import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
import { useSyncExternalStore } from "react";
import type { Draft, Entry } from "./types";

const KEY = "tally.entries.v1";
const listeners = new Set<() => void>();
let entries: Entry[] = [];
let loaded = false;

function emit() {
  listeners.forEach((l) => l());
}

/** Load the book from the phone once at start-up. */
export async function loadEntries() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    entries = raw ? (JSON.parse(raw) as Entry[]) : [];
  } catch {
    entries = [];
  }
  loaded = true;
  emit();
}

function save(next: Entry[]) {
  entries = [...next].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  emit();
  AsyncStorage.setItem(KEY, JSON.stringify(entries)).catch(() => {
    // Keep the in-memory copy; the next save will try again.
  });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useEntries(): Entry[] {
  return useSyncExternalStore(subscribe, () => entries);
}

export function useLoaded(): boolean {
  return useSyncExternalStore(subscribe, () => loaded);
}

export function addEntry(draft: Draft): Entry {
  const entry: Entry = { ...draft, id: randomUUID(), createdAt: new Date().toISOString() };
  save([entry, ...entries]);
  return entry;
}

export function replaceAll(next: Entry[]) {
  save(next);
}
