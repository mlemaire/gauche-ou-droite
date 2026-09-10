export type Vote = { item: string; choice: "left" | "right" };

const VOTES_PREFIX = "votes-";

export function getStoredVotes(dayKey: string): Vote[] | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(VOTES_PREFIX + dayKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Vote[]) : null;
  } catch {
    return null;
  }
}

export function saveVotes(dayKey: string, votes: Vote[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VOTES_PREFIX + dayKey, JSON.stringify(votes));
}

export function hasPlayed(dayKey: string): boolean {
  return getStoredVotes(dayKey) !== null;
}
