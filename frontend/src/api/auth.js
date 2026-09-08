import client from './client'

export function fetchCsrf() {
  return client.get('/accounts/csrf/')
}

export function fetchMe() {
  return client.get('/accounts/me/')
}

export function login(회원id, 회원비밀번호) {
  return client.post('/accounts/login/', { 회원id, 회원비밀번호 })
}

export function logout() {
  return client.post('/accounts/logout/')
}

export function signup(payload) {
  return client.post('/accounts/signup/', payload)
}

export function updateMe(payload) {
  return client.patch('/accounts/me/', payload)
}
