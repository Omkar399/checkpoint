import client from "./client";
import type { Server, ServerMember } from "./types";

export function createServer(name: string, description?: string | null) {
  return client.post<Server>("/servers", { name, description });
}

export function getServers() {
  return client.get<Server[]>("/servers");
}

export function getServer(id: number) {
  return client.get<Server>(`/servers/${id}`);
}

export function getServerMembers(id: number) {
  return client.get<ServerMember[]>(`/servers/${id}/members`);
}
