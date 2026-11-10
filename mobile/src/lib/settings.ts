import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import type { SpeechLanguage } from "./api";

const KEY = "tally.language";

export const LANGUAGES: { id: SpeechLanguage; label: string }[] = [
  { id: "pidgin", label: "Pidgin" },
  { id: "yoruba", label: "Yorùbá" },
  { id: "hausa", label: "Hausa" },
  { id: "igbo", label: "Igbo" },
  { id: "nigerian_english", label: "English" },
];

export function useLanguage(): [SpeechLanguage, (l: SpeechLanguage) => void] {
  const [lang, setLang] = useState<SpeechLanguage>("pidgin");
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => v && setLang(v as SpeechLanguage)).catch(() => {});
  }, []);
  return [
    lang,
    (l) => {
      setLang(l);
      AsyncStorage.setItem(KEY, l).catch(() => {});
    },
  ];
}
