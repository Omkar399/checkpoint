import client from "./client";
import type { CreateInviteRequest, Invite } from "./types";

export function createInvite(serverId: number, data: CreateInviteRequest = {}) {
  return client.post<Invite>(`/servers/${serverId}/invites`, data);
}

export function getInvites(serverId: number) {
  return client.get<Invite[]>(`/servers/${serverId}/invites`);
}

export function joinByInvite(code: string) {
  return client.post(`/invites/${code}/join`);
}
