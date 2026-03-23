import client from './client'

export function register(email, username, password) {
  return client.post('/auth/register', { email, username, password })
}

export function login(email, password) {
  return client.post('/auth/login', { email, password })
}

export function getMe() {
  return client.get('/auth/me')
}
