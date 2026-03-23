import client from './client'

export function createChannel(serverId, data) {
  return client.post(`/servers/${serverId}/channels`, data)
}

export function getChannels(serverId) {
  return client.get(`/servers/${serverId}/channels`)
}

export function getChannel(id) {
  return client.get(`/channels/${id}`)
}

export function joinChannel(id) {
  return client.post(`/channels/${id}/join`)
}

export function leaveChannel(id) {
  return client.delete(`/channels/${id}/members/me`)
}

export function getChannelMembers(id) {
  return client.get(`/channels/${id}/members`)
}
