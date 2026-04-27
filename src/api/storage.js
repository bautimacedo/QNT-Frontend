const TOKEN_KEY = 'qnt_jwt'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getTokenExpiry() {
  const token = getToken()
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

export function isTokenExpiringSoon(thresholdMs = 5 * 60 * 1000) {
  const expiry = getTokenExpiry()
  if (!expiry) return false
  return expiry - Date.now() < thresholdMs
}

export function isTokenExpired() {
  const expiry = getTokenExpiry()
  if (!expiry) return true
  return Date.now() >= expiry
}
