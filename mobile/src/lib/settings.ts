import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import type { SpeechLanguage } from "./api";

const KEY = "tally.language";

export const LANGUAGES: { id: SpeechLanguage; label: string }[] = [
  { id: "pidgin", label: "Pidgin" },
  { id: "yoruba", label: "Yorùbá" },
  { id: "hausa", label: "Hausa" },
  { id: "igbo", label: "Igbo" },
  { id: "nigerian_english", label: "English" },
];

// One shared value, so every screen (greeting, record) updates the moment it changes.
let current: SpeechLanguage = "pidgin";
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

AsyncStorage.getItem(KEY)
  .then((v) => {
    if (v && LANGUAGES.some((l) => l.id === v)) {
      current = v as SpeechLanguage;
      emit();
    }
  })
  .catch(() => {});

function setLanguage(l: SpeechLanguage) {
  current = l;
  emit();
  AsyncStorage.setItem(KEY, l).catch(() => {});
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useLanguage(): [SpeechLanguage, (l: SpeechLanguage) => void] {
  const lang = useSyncExternalStore(subscribe, () => current, () => current);
  return [lang, setLanguage];
}
