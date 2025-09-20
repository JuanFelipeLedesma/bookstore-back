import type { Prize } from "../types/prize";

export async function fetchPrizes(): Promise<Prize[]> {
  const res = await fetch(`/api/prizes`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Error fetching prizes: ${res.status}`);
  return res.json();
}

export async function fetchPrizesByAuthor(authorId: string | number): Promise<Prize[]> {
  const all = await fetchPrizes();
  return all.filter(p => String(p.author?.id) === String(authorId));
}

export async function removeAuthorFromPrize(prizeId: string | number): Promise<void> {
  const res = await fetch(`/api/prizes/${prizeId}/author`, { method: "DELETE" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DELETE /api/prizes/${  prizeId}/author -> ${res.status} ${text}`);
  }
}