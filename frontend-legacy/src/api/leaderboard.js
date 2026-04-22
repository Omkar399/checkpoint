import client from './client'

export function getLeaderboard(channelId, month, year) {
  const params = {}
  if (month) params.month = month
  if (year) params.year = year
  return client.get(`/channels/${channelId}/leaderboard`, { params })
}
