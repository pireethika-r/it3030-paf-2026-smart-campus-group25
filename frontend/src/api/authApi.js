import { API_BASE_URL } from '../config.js'

const AUTH_API_BASE = `${API_BASE_URL}/api/auth`

const parseResponse = async (response) => {
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed')
  }

  return data
}

export const requestSignupCode = async (payload) => {
  const response = await fetch(`${AUTH_API_BASE}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse(response)
}

export const verifySignupCode = async ({ email, code }) => {
  const response = await fetch(`${AUTH_API_BASE}/signup/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  })

  return parseResponse(response)
}

export const requestPasswordResetCode = async ({ email }) => {
  const response = await fetch(`${AUTH_API_BASE}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  return parseResponse(response)
}

export const verifyPasswordReset = async ({ email, code, newPassword, confirmPassword }) => {
  const response = await fetch(`${AUTH_API_BASE}/forgot-password/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, newPassword, confirmPassword }),
  })

  return parseResponse(response)
}

export const updateOwnProfile = async (payload) => {
  const response = await fetch(`${AUTH_API_BASE}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse(response)
}

export const deleteOwnProfile = async (email) => {
  const response = await fetch(`${AUTH_API_BASE}/profile?email=${encodeURIComponent(email)}`, {
    method: 'DELETE',
  })

  return parseResponse(response)
}