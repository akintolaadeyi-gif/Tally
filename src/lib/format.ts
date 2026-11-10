export function naira(n: number): string {
  const sign = n < 0 ? "−" : "";
  return `${sign}₦${Math.abs(Math.round(n)).toLocaleString("en-NG")}`;
}

export function todayISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function time(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function shortDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function daysBetween(fromISODate: string, toISODate: string): number {
  const a = new Date(`${fromISODate}T12:00:00`).getTime();
  const b = new Date(`${toISODate}T12:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}
