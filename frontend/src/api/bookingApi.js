import { resolveApiBase } from '../utils/apiUrl.js'

const API_BASE = `${resolveApiBase()}/api/bookings`

const parseResponse = async (response) => {
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(data?.message || 'Request failed')
    error.suggestions = data?.suggestions || []
    throw error
  }

  return data
}

export const createBooking = async (payload) => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse(response)
}

export const verifyStudentForAdmin = async ({ requesterName, requesterEmail, requesterItNumber }) => {
  const query = new URLSearchParams({
    name: requesterName,
    email: requesterEmail,
    itNumber: requesterItNumber,
  })

  const response = await fetch(`${API_BASE}/verify-student?${query.toString()}`, {
    method: 'GET',
  })

  return parseResponse(response)
}

export const getMyBookings = async (email) => {
  const query = new URLSearchParams({ email })
  const response = await fetch(`${API_BASE}/my?${query.toString()}`, {
    method: 'GET',
  })

  return parseResponse(response)
}

export const getMyUpcomingBookings = async (email, days = 14) => {
  const query = new URLSearchParams({ email, days: String(days) })
  const response = await fetch(`${API_BASE}/my/upcoming?${query.toString()}`, {
    method: 'GET',
  })

  return parseResponse(response)
}

export const getMyBookingSummary = async (email) => {
  const query = new URLSearchParams({ email })
  const response = await fetch(`${API_BASE}/my/summary?${query.toString()}`, {
    method: 'GET',
  })

  return parseResponse(response)
}

export const getBookings = async ({ status } = {}) => {
  const query = new URLSearchParams()

  if (status && status !== 'ALL') {
    query.set('status', status)
  }

  const response = await fetch(`${API_BASE}?${query.toString()}`, {
    method: 'GET',
  })

  return parseResponse(response)
}

export const getAdminAnalytics = async () => {
  const response = await fetch(`${API_BASE}/admin/analytics`, {
    method: 'GET',
  })

  return parseResponse(response)
}

export const getCalendarBookings = async ({ from, to, email } = {}) => {
  const query = new URLSearchParams()
  if (from) {
    query.set('from', from)
  }
  if (to) {
    query.set('to', to)
  }
  if (email) {
    query.set('email', email)
  }

  const response = await fetch(`${API_BASE}/calendar?${query.toString()}`, {
    method: 'GET',
  })

  return parseResponse(response)
}

export const updateBooking = async (id, email, payload) => {
  const query = new URLSearchParams({ email })
  const response = await fetch(`${API_BASE}/${id}?${query.toString()}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse(response)
}

export const approveBooking = async (id, adminNote) => {
  const response = await fetch(`${API_BASE}/${id}/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminNote }),
  })

  return parseResponse(response)
}

export const rejectBooking = async (id, adminNote) => {
  const response = await fetch(`${API_BASE}/${id}/reject`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminNote }),
  })

  return parseResponse(response)
}

export const cancelBooking = async (id, email) => {
  const query = new URLSearchParams({ email })
  const response = await fetch(`${API_BASE}/${id}/cancel?${query.toString()}`, {
    method: 'PATCH',
  })

  return parseResponse(response)
}

export const deleteBooking = async (id, email) => {
  const query = new URLSearchParams({ email })
  const response = await fetch(`${API_BASE}/${id}?${query.toString()}`, {
    method: 'DELETE',
  })

  return parseResponse(response)
}

export const checkInBooking = async (id, token) => {
  const query = new URLSearchParams({ token })
  const response = await fetch(`${API_BASE}/${id}/check-in?${query.toString()}`, {
    method: 'PATCH',
  })

  return parseResponse(response)
}

export const getBookingByQrToken = async (token) => {
  const response = await fetch(`${API_BASE}/qr/${encodeURIComponent(token)}`, {
    method: 'GET',
  })

  return parseResponse(response)
}
