import client from "./client";
import type { Channel, ChannelMember, CreateChannelRequest } from "./types";

export function createChannel(serverId: number, data: CreateChannelRequest) {
  return client.post<Channel>(`/servers/${serverId}/channels`, data);
}

export function getChannels(serverId: number) {
  return client.get<Channel[]>(`/servers/${serverId}/channels`);
}

export function getChannel(id: number) {
  return client.get<Channel>(`/channels/${id}`);
}

export function joinChannel(id: number) {
  return client.post(`/channels/${id}/join`);
}

export function leaveChannel(id: number) {
  return client.delete(`/channels/${id}/members/me`);
}

export function getChannelMembers(id: number) {
  return client.get<ChannelMember[]>(`/channels/${id}/members`);
}
