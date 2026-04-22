import client from './client'

export function createInvite(serverId, data) {
  return client.post(`/servers/${serverId}/invites`, data)
}

export function getInvites(serverId) {
  return client.get(`/servers/${serverId}/invites`)
}

export function joinByInvite(code) {
  return client.post(`/invites/${code}/join`)
}
