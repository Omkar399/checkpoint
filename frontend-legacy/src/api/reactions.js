import client from './client'

export function addReaction(checkinId, emoji) {
  return client.post(`/checkins/${checkinId}/reactions`, { emoji })
}

export function removeReaction(checkinId, emoji) {
  return client.delete(`/checkins/${checkinId}/reactions/${encodeURIComponent(emoji)}`)
}

export function getReactions(checkinId) {
  return client.get(`/checkins/${checkinId}/reactions`)
}
