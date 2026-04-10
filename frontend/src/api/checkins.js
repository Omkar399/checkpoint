import client from './client'

export function createCheckin(channelId, data) {
  return client.post(`/channels/${channelId}/checkins`, data)
}

export function getCheckins(channelId, date) {
  const params = {}
  if (date) {
    params.date = date
  }
  return client.get(`/channels/${channelId}/checkins`, { params })
}

export function getDashboard(channelId) {
  return client.get(`/channels/${channelId}/checkins/dashboard`)
}

export function getStreak(channelId) {
  return client.get(`/channels/${channelId}/checkins/streak`)
}
