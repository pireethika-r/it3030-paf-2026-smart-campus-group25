import { API_BASE_URL } from '../config.js'
import { getAuthUser } from '../auth/roles.js'

const TICKETS_API_BASE = `${API_BASE_URL}/api/tickets`

const buildHeaders = (json = true) => {
  const user = getAuthUser()
  const headers = {
    'X-User-Email': user?.email || '',
    'X-User-Name': user?.fullName || '',
    'X-User-Role': user?.role || 'USER',
  }

  if (json) {
    headers['Content-Type'] = 'application/json'
  }

  return headers
}

const parseJsonResponse = async (response) => {
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(data?.message || 'Request failed')
    error.status = response.status
    error.details = data?.errors || null
    throw error
  }
  return data
}

export const createTicket = async (payload) => {
  const response = await fetch(TICKETS_API_BASE, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })

  return parseJsonResponse(response)
}

export const getMyTickets = async () => {
  const response = await fetch(`${TICKETS_API_BASE}/my`, {
    headers: buildHeaders(false),
  })

  return parseJsonResponse(response)
}

export const getAllTickets = async () => {
  const response = await fetch(TICKETS_API_BASE, {
    headers: buildHeaders(false),
  })

  return parseJsonResponse(response)
}

export const getTicketById = async (id) => {
  const response = await fetch(`${TICKETS_API_BASE}/${id}`, {
    headers: buildHeaders(false),
  })

  return parseJsonResponse(response)
}

export const updateTicket = async (id, payload) => {
  const response = await fetch(`${TICKETS_API_BASE}/${id}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })

  return parseJsonResponse(response)
}

export const cancelTicket = async (id) => {
  const response = await fetch(`${TICKETS_API_BASE}/${id}/cancel`, {
    method: 'PATCH',
    headers: buildHeaders(false),
  })

  return parseJsonResponse(response)
}

export const assignTechnician = async (id, technicianEmail) => {
  const response = await fetch(`${TICKETS_API_BASE}/${id}/assign`, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify({ technicianEmail }),
  })

  return parseJsonResponse(response)
}

export const updateTicketStatus = async (id, payload) => {
  const response = await fetch(`${TICKETS_API_BASE}/${id}/status`, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })

  return parseJsonResponse(response)
}

export const addResolutionNotes = async (id, resolutionNotes) => {
  const response = await fetch(`${TICKETS_API_BASE}/${id}/resolution-notes`, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify({ resolutionNotes }),
  })

  return parseJsonResponse(response)
}

export const addRequesterReply = async (id, replyMessage) => {
  const response = await fetch(`${TICKETS_API_BASE}/${id}/requester-reply`, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify({ replyMessage }),
  })

  return parseJsonResponse(response)
}

export const updateAdminFollowUp = async (id, payload) => {
  const response = await fetch(`${TICKETS_API_BASE}/${id}/admin-follow-up`, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })

  return parseJsonResponse(response)
}

export const getTicketNotifications = async () => {
  const response = await fetch(`${TICKETS_API_BASE}/notifications`, {
    headers: buildHeaders(false),
  })

  return parseJsonResponse(response)
}

export const markTicketNotificationAsRead = async (notificationId) => {
  const response = await fetch(`${TICKETS_API_BASE}/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: buildHeaders(false),
  })

  return parseJsonResponse(response)
}

export const uploadAttachments = async (id, files) => {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  const user = getAuthUser()
  const response = await fetch(`${TICKETS_API_BASE}/${id}/attachments`, {
    method: 'POST',
    headers: {
      'X-User-Email': user?.email || '',
      'X-User-Name': user?.fullName || '',
      'X-User-Role': user?.role || 'USER',
    },
    body: formData,
  })

  return parseJsonResponse(response)
}

export const getTicketAttachmentUrl = (attachmentId) => `${TICKETS_API_BASE}/attachments/${attachmentId}`

export const deleteAttachment = async (attachmentId) => {
  const response = await fetch(`${TICKETS_API_BASE}/attachments/${attachmentId}`, {
    method: 'DELETE',
    headers: buildHeaders(false),
  })

  return parseJsonResponse(response)
}