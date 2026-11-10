import { todayISO } from "./format";
import type { Entry } from "./types";

/** Demo data so the app can be shown before anyone has recorded anything. */
export function sampleEntries(): Entry[] {
  const now = new Date();
  const at = (daysAgo: number, h: number, m: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  const due = (daysFromNow: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysFromNow);
    return todayISO(d);
  };
  let n = 0;
  const e = (x: Omit<Entry, "id">): Entry => ({ ...x, id: `sample-${n++}` });
  const list: Entry[] = [
    e({ type: "sale", item: "Rice", quantity: 3, unit: "bags", amount: 18000, party: "Mama Tunde", payment: "credit", dueDate: due(3), createdAt: at(0, 10, 42), transcript: "Mama Tunde don carry three bag rice, 18k. She go pay Friday." }),
    e({ type: "sale", item: "Indomie", quantity: 2, unit: "cartons", amount: 26000, party: null, payment: "transfer", dueDate: null, createdAt: at(0, 10, 15), transcript: "I sell two carton Indomie, 26 thousand, transfer." }),
    e({ type: "purchase", item: "Rice", quantity: 10, unit: "bags", amount: 520000, party: "Alhaji Musa", payment: "cash", dueDate: null, createdAt: at(0, 8, 30), transcript: "I buy ten bag rice from Alhaji Musa, 520k." }),
    e({ type: "sale", item: "Groundnut oil", quantity: 4, unit: "tins", amount: 40500, party: null, payment: "cash", dueDate: null, createdAt: at(0, 9, 5), transcript: "Four tin groundnut oil, 40,500 cash." }),
    e({ type: "sale", item: "Beans", quantity: 6, unit: "bags", amount: 42000, party: "Iya Kemi", payment: "credit", dueDate: due(-6), createdAt: at(9, 11, 0), transcript: "Iya Kemi take six bag beans on credit, 42k." }),
    e({ type: "sale", item: "Garri", quantity: 3, unit: "bags", amount: 15000, party: "Brother Chidi", payment: "credit", dueDate: due(-2), createdAt: at(5, 14, 20), transcript: "Brother Chidi collect three bag garri, 15k, he go pay Sunday." }),
    e({ type: "sale", item: "Rice", quantity: 2, unit: "bags", amount: 12000, party: "Aunty Ngozi", payment: "credit", dueDate: due(-8), createdAt: at(12, 12, 10), transcript: "Aunty Ngozi two bag rice, 12k credit." }),
    e({ type: "payment", item: "", quantity: null, unit: null, amount: 12000, party: "Aunty Ngozi", payment: "cash", dueDate: null, createdAt: at(9, 16, 0), transcript: "Aunty Ngozi don pay her 12k." }),
    e({ type: "sale", item: "Semovita", quantity: 2, unit: "bags", amount: 16000, party: "Aunty Ngozi", payment: "credit", dueDate: due(6), createdAt: at(1, 13, 0), transcript: "Aunty Ngozi carry two bag Semovita, 16k, she go pay Monday." }),
  ];
  // A few weeks of ordinary cash days so the business record has history.
  for (let d = 1; d <= 37; d++) {
    list.push(e({ type: "sale", item: "Mixed goods", quantity: null, unit: null, amount: 60000 + ((d * 7919) % 30000), party: null, payment: d % 3 ? "cash" : "transfer", dueDate: null, createdAt: at(d, 17, 30), transcript: "End of day sales." }));
  }
  return list;
}
