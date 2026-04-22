import client from './client'

export function sendMessage(channelId, content) {
  return client.post(`/channels/${channelId}/messages`, { content })
}

export function getMessages(channelId, beforeId) {
  const params = { limit: 50 }
  if (beforeId) {
    params.before = beforeId
  }
  return client.get(`/channels/${channelId}/messages`, { params })
}

export function pollMessages(channelId, afterId) {
  const params = {}
  if (afterId) {
    params.after = afterId
  }
  return client.get(`/channels/${channelId}/messages/poll`, { params })
}
