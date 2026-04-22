import client from "./client";
import type { CheckIn, CheckInCreate, DailyStatusEntry, StreakResponse } from "./types";

export function createCheckin(channelId: number, data: CheckInCreate) {
  return client.post<CheckIn>(`/channels/${channelId}/checkins`, data);
}

export function getCheckins(channelId: number, date?: string) {
  const params: Record<string, string> = {};
  if (date) params.date = date;
  return client.get<CheckIn[]>(`/channels/${channelId}/checkins`, { params });
}

export function getDashboard(channelId: number) {
  return client.get<DailyStatusEntry[]>(`/channels/${channelId}/dashboard`);
}

export function getStreak(channelId: number) {
  return client.get<StreakResponse>(`/channels/${channelId}/streak`);
}
