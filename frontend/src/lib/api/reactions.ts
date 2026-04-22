import client from "./client";
import type { ReactionSummary } from "./types";

export function addReaction(checkinId: number, emoji: string) {
  return client.post(`/checkins/${checkinId}/reactions`, { emoji });
}

export function removeReaction(checkinId: number, emoji: string) {
  return client.delete(`/checkins/${checkinId}/reactions/${encodeURIComponent(emoji)}`);
}

export function getReactions(checkinId: number) {
  return client.get<ReactionSummary[]>(`/checkins/${checkinId}/reactions`);
}
