import client from './client'

export function getUserProfile(userId) {
  return client.get(`/users/${userId}`)
}

export function getUserHeatmap(userId, channelId, year) {
  const params = {}
  if (channelId) {
    params.channel_id = channelId
  }
  if (year) {
    params.year = year
  }
  return client.get(`/users/${userId}/heatmap`, { params })
}
