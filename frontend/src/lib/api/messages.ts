import client from "./client";
import type { Message } from "./types";

export function sendMessage(channelId: number, content: string) {
  return client.post<Message>(`/channels/${channelId}/messages`, { content });
}

export function getMessages(channelId: number, beforeId?: number) {
  const params: Record<string, number> = { limit: 50 };
  if (beforeId) params.before = beforeId;
  return client.get<Message[]>(`/channels/${channelId}/messages`, { params });
}

export function pollMessages(channelId: number, afterId?: number | null) {
  const params: Record<string, number> = {};
  if (afterId) params.after = afterId;
  return client.get<Message[]>(`/channels/${channelId}/messages/poll`, { params });
}
