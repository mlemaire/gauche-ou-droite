import { ROTATION_START } from "@/data/items";

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromDayKey(key: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return new Date(NaN);
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

export function todayKey(): string {
  return toDayKey(new Date());
}

/** Une date est jouable si elle est comprise entre le début de la rotation et aujourd'hui inclus. */
export function isPlayableDayKey(key: string): boolean {
  const date = fromDayKey(key);
  if (Number.isNaN(date.getTime())) return false;
  const time = startOfDay(date).getTime();
  return (
    time >= startOfDay(ROTATION_START).getTime() &&
    time <= startOfDay(new Date()).getTime()
  );
}

/** Liste des jours jouables du plus récent au plus ancien (aujourd'hui inclus). */
export function listPlayableDayKeys(): string[] {
  const start = startOfDay(ROTATION_START).getTime();
  const end = startOfDay(new Date()).getTime();
  const days: string[] = [];
  for (let t = end; t >= start; t -= 86400000) {
    days.push(toDayKey(new Date(t)));
  }
  return days;
}

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDayLabel(key: string): string {
  const date = fromDayKey(key);
  if (Number.isNaN(date.getTime())) return key;
  const label = DAY_LABEL_FORMATTER.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}
