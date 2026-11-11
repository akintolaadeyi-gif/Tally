import type { SpeechLanguage } from "./api";

type Part = "morning" | "afternoon" | "evening";

const GREETINGS: Record<SpeechLanguage, Record<Part, string>> = {
  nigerian_english: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening" },
  pidgin: { morning: "Good morning o", afternoon: "Good afternoon o", evening: "Good evening o" },
  yoruba: { morning: "Ẹ káàárọ̀", afternoon: "Ẹ káàsán", evening: "Ẹ kúùrọ̀lẹ́" },
  hausa: { morning: "Ina kwana", afternoon: "Barka da rana", evening: "Barka da yamma" },
  igbo: { morning: "Ụtụtụ ọma", afternoon: "Ehihie ọma", evening: "Mgbede ọma" },
};

/** Greeting in the trader's chosen language for the time of day. */
export function greeting(language: SpeechLanguage, hour = new Date().getHours()): string {
  const part: Part = hour < 12 ? "morning" : hour < 16 ? "afternoon" : "evening";
  return GREETINGS[language][part];
}
