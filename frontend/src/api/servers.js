import client from './client'

export function createServer(name, description) {
  return client.post('/servers', { name, description })
}

export function getServers() {
  return client.get('/servers')
}

export function getServer(id) {
  return client.get(`/servers/${id}`)
}

export function getServerMembers(id) {
  return client.get(`/servers/${id}/members`)
}
