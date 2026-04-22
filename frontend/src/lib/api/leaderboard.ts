import client from "./client";
import type { LeaderboardRow } from "./types";

export function getLeaderboard(channelId: number, month?: number, year?: number) {
  const params: Record<string, number> = {};
  if (month) params.month = month;
  if (year) params.year = year;
  return client.get<LeaderboardRow[]>(`/channels/${channelId}/leaderboard`, { params });
}
