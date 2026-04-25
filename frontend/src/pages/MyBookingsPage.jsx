import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  cancelBooking,
  deleteBooking,
  getMyBookingSummary,
  getMyBookings,
  getMyUpcomingBookings,
  updateBooking,
} from '../api/bookingApi.js'
import { buildQrScanUrl } from '../utils/publicAppUrl.js'

const editableStatuses = ['PENDING']

const statusBadge = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-rose-100 text-rose-800',
  CANCELLED: 'bg-slate-200 text-slate-700',
}

const formatDate = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

const formatTime = (value) =>
  new Date(`2026-01-01T${value}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

const formatDateTime = (value) =>
  new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

const buildQrImageUrl = (token) => {
  const scanUrl = buildQrScanUrl(token)
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(scanUrl)}`
}

const MyBookingsPage = () => {
  const savedUser = localStorage.getItem('auth_user')
  const [bookings, setBookings] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [summary, setSummary] = useState(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const user = useMemo(() => (savedUser ? JSON.parse(savedUser) : null), [savedUser])
  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN'

  const loadBookings = useCallback(async () => {
    if (!user) {
      return
    }

    try {
      setLoading(true)
      setError('')
      const [allBookings, upcomingBookings, summaryData] = await Promise.all([
        getMyBookings(user.email),
        getMyUpcomingBookings(user.email, 14),
        getMyBookingSummary(user.email),
      ])
      setBookings(allBookings)
      setUpcoming(upcomingBookings)
      setSummary(summaryData)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      void loadBookings()
    }
  }, [loadBookings, user])

  const onCancel = async (id) => {
    setError('')
    setMessage('')
    try {
      await cancelBooking(id, user.email)
      setMessage('Booking cancelled successfully.')
      void loadBookings()
    } catch (cancelError) {
      setError(cancelError.message)
    }
  }

  const onEditClick = (booking) => {
    setEditingId(booking.id)
    setEditForm({
      resourceType: booking.resourceType,
      resourceName: booking.resourceName,
      purpose: booking.purpose,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
    })
  }

  const onEditSave = async () => {
    if (!editingId || !editForm) {
      return
    }

    try {
      await updateBooking(editingId, user.email, editForm)
      setMessage('Booking updated successfully.')
      setEditingId(null)
      setEditForm(null)
      void loadBookings()
    } catch (updateError) {
      setError(updateError.message)
    }
  }

  const onDelete = async (id) => {
    setError('')
    setMessage('')

    try {
      await deleteBooking(id, user.email)
      setMessage('Booking deleted successfully.')
      void loadBookings()
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter
      const search = query.trim().toLowerCase()
      const matchesQuery =
        search.length === 0 ||
        booking.resourceName.toLowerCase().includes(search) ||
        booking.purpose.toLowerCase().includes(search) ||
        booking.bookingDate.includes(search)

      return matchesStatus && matchesQuery
    })
  }, [bookings, query, statusFilter])

  const exportBookingsCsv = () => {
    if (filteredBookings.length === 0) {
      setError('No bookings available to export.')
      return
    }

    const headers = [
      'Booking ID',
      'Resource Name',
      'Resource Type',
      'Date',
      'Start Time',
      'End Time',
      'Status',
      'Purpose',
      'Admin Note',
    ]

    const escapeCsv = (value) => {
      const text = String(value ?? '')
      return `"${text.replaceAll('"', '""')}"`
    }

    const rows = filteredBookings.map((booking) => [
      booking.id,
      booking.resourceName,
      booking.resourceType,
      booking.bookingDate,
      booking.startTime,
      booking.endTime,
      booking.status,
      booking.purpose,
      booking.adminNote || '',
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `my-bookings-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
    setMessage('CSV export downloaded successfully.')
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (isAdmin) {
    return <Navigate to="/bookings/approval" replace />
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-black text-slate-900">My Bookings</h1>
          <div className="flex gap-2 text-sm">
            {!isAdmin ? <Link to="/bookings/form" className="rounded-lg border border-slate-300 px-3 py-1.5">New Booking</Link> : null}
            <Link to="/bookings/calendar" className="rounded-lg border border-slate-300 px-3 py-1.5">Calendar</Link>
            <Link to="/dashboard" className="rounded-lg border border-slate-300 px-3 py-1.5">Dashboard</Link>
          </div>
        </div>

        {message ? <p className="mb-3 rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mb-3 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

        {summary ? (
          <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-10">
            <div className="rounded-xl bg-slate-100 p-3 text-center"><p className="text-xs text-slate-500">Total</p><p className="text-lg font-bold text-slate-900">{summary.total}</p></div>
            <div className="rounded-xl bg-amber-100 p-3 text-center"><p className="text-xs text-amber-700">Pending</p><p className="text-lg font-bold text-amber-900">{summary.pending}</p></div>
            <div className="rounded-xl bg-emerald-100 p-3 text-center"><p className="text-xs text-emerald-700">Approved</p><p className="text-lg font-bold text-emerald-900">{summary.approved}</p></div>
            <div className="rounded-xl bg-rose-100 p-3 text-center"><p className="text-xs text-rose-700">Rejected</p><p className="text-lg font-bold text-rose-900">{summary.rejected}</p></div>
            <div className="rounded-xl bg-slate-200 p-3 text-center"><p className="text-xs text-slate-600">Cancelled</p><p className="text-lg font-bold text-slate-800">{summary.cancelled}</p></div>
            <div className="rounded-xl bg-cyan-100 p-3 text-center"><p className="text-xs text-cyan-700">Checked In</p><p className="text-lg font-bold text-cyan-900">{summary.checkedIn}</p></div>
            <div className="rounded-xl bg-indigo-100 p-3 text-center"><p className="text-xs text-indigo-700">Upcoming</p><p className="text-lg font-bold text-indigo-900">{summary.upcoming}</p></div>
            <div className="rounded-xl bg-violet-100 p-3 text-center"><p className="text-xs text-violet-700">Next Date</p><p className="text-sm font-bold text-violet-900">{summary.nextBookingDate || 'N/A'}</p></div>
            <div className="rounded-xl bg-sky-100 p-3 text-center"><p className="text-xs text-sky-700">Peak Hour</p><p className="text-sm font-bold text-sky-900">{summary.peakHour || 'N/A'}</p></div>
            <div className="rounded-xl bg-lime-100 p-3 text-center"><p className="text-xs text-lime-700">Top Resource</p><p className="text-sm font-bold text-lime-900">{summary.mostUsedResource || 'N/A'}</p></div>
          </div>
        ) : null}

        <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by resource, purpose, or date"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            onClick={() => void loadBookings()}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
          >
            Refresh
          </button>
          <button
            onClick={exportBookingsCsv}
            className="rounded-xl border border-sky-300 px-3 py-2 text-sm font-semibold text-sky-700"
          >
            Export CSV
          </button>
        </div>

        {upcoming.length > 0 ? (
          <div className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-sm font-semibold text-indigo-900">Upcoming (next 14 days)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {upcoming.slice(0, 4).map((item) => (
                <span key={item.id} className="rounded-lg bg-white px-3 py-1 text-xs text-indigo-900 ring-1 ring-indigo-200">
                  {item.bookingDate} {item.startTime} {item.resourceName}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          {loading ? <p className="text-sm text-slate-500">Loading bookings...</p> : null}

          {filteredBookings.map((booking) => (
            <div key={booking.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 px-5 py-4 transition hover:border-slate-300 hover:bg-white">
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-black text-slate-900">{booking.resourceName}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadge[booking.status] || 'bg-slate-100 text-slate-700'}`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{booking.purpose}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                    Created {booking.createdAt ? formatDateTime(booking.createdAt) : 'just now'}
                  </p>
                </div>

                <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-1">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Schedule</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {formatDate(booking.bookingDate)} · {formatTime(booking.startTime)} to {formatTime(booking.endTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Attendance</p>
                    <p className="mt-1 font-semibold text-slate-900">{booking.expectedAttendees || 0} attendees</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-end">
                  {booking.cancelReason ? (
                    <p className="max-w-55 text-right text-xs text-slate-500">{booking.cancelReason}</p>
                  ) : (
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{booking.resourceType || 'RESOURCE'}</span>
                  )}

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {editableStatuses.includes(booking.status) ? (
                      <button onClick={() => onEditClick(booking)} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100">Edit</button>
                    ) : null}
                    {(booking.status === 'PENDING' || booking.status === 'APPROVED') ? (
                      <button onClick={() => onCancel(booking.id)} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700">Cancel</button>
                    ) : null}
                    {(booking.status === 'REJECTED' || booking.status === 'CANCELLED') ? (
                      <button onClick={() => onDelete(booking.id)} className="rounded-full border border-rose-300 px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50">Delete</button>
                    ) : null}
                  </div>
                </div>
              </div>

              {booking.status === 'APPROVED' && booking.qrToken ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">QR Check-in</p>
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={buildQrImageUrl(booking.qrToken)}
                      alt="Booking QR code"
                      className="h-20 w-20 rounded-lg border border-emerald-200 bg-white p-1"
                    />
                    <div>
                      <p className="text-xs text-emerald-700">Scan this code at check-in.</p>
                      <p className="mt-1 text-[11px] text-slate-500">Token: {booking.qrToken.slice(0, 10)}...</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {editingId === booking.id && editForm ? (
                <div className="mt-4 grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
                  <input
                    value={editForm.resourceName}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, resourceName: event.target.value }))}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Resource"
                  />
                  <input
                    value={editForm.resourceType}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, resourceType: event.target.value }))}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Type"
                  />
                  <input
                    type="date"
                    value={editForm.bookingDate}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, bookingDate: event.target.value }))}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="time"
                      value={editForm.startTime}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, startTime: event.target.value }))}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="time"
                      value={editForm.endTime}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, endTime: event.target.value }))}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <textarea
                    value={editForm.purpose}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, purpose: event.target.value }))}
                    rows={2}
                    className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Purpose"
                  />
                  <div className="sm:col-span-2 flex gap-2">
                    <button onClick={onEditSave} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">Save</button>
                    <button onClick={() => { setEditingId(null); setEditForm(null) }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold">Close</button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}

          {!loading && filteredBookings.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No bookings found for your current filters.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default MyBookingsPage
