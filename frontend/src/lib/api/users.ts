import client from "./client";
import type { HeatmapEntry, User } from "./types";

export function getUserProfile(userId: number) {
  return client.get<User>(`/users/${userId}/profile`);
}

export function getUserHeatmap(
  userId: number,
  channelId?: number,
  year?: number,
) {
  const params: Record<string, number> = {};
  if (channelId) params.channel_id = channelId;
  if (year) params.year = year;
  return client.get<HeatmapEntry[]>(`/users/${userId}/heatmap`, { params });
}
