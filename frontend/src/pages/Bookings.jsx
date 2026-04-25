import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { cancelBooking, createBooking, getBookings, updateBookingStatus } from '../api/bookingApi.js'

const resourceTypes = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT']
const statusOptions = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']

const defaultForm = {
  resourceType: 'LECTURE_HALL',
  resourceName: '',
  purpose: '',
  bookingDate: '',
  startTime: '',
  endTime: '',
}

const badgeStyles = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
  CANCELLED: 'bg-slate-200 text-slate-700',
}

const Bookings = () => {
  const navigate = useNavigate()
  const savedUser = localStorage.getItem('auth_user')
  const [formData, setFormData] = useState(defaultForm)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const user = useMemo(() => {
    if (!savedUser) {
      return null
    }

    return JSON.parse(savedUser)
  }, [savedUser])

  const userEmail = user?.email || ''
  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN'

  const bookingStats = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter((booking) => booking.status === 'PENDING').length,
    approved: bookings.filter((booking) => booking.status === 'APPROVED').length,
    rejected: bookings.filter((booking) => booking.status === 'REJECTED').length,
  }), [bookings])

  const loadBookings = useCallback(async () => {
    if (!user) {
      setBookings([])
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await getBookings({
        email: isAdmin ? undefined : userEmail,
        status: statusFilter,
      })
      setBookings(response)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [isAdmin, statusFilter, user, userEmail])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const resetForm = () => {
    setFormData(defaultForm)
  }

  const handleCreateBooking = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      await createBooking({
        requesterName: user.fullName || 'Student User',
        requesterEmail: userEmail,
        requesterItNumber: user.itNumber || user.itNo || 'UNKNOWN',
        resourceType: formData.resourceType,
        resourceName: formData.resourceName.trim(),
        purpose: formData.purpose.trim(),
        bookingDate: formData.bookingDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
      })

      setMessage('Booking request submitted successfully.')
      resetForm()
      loadBookings()
    } catch (createError) {
      setError(createError.message)
    }
  }

  const handleCancelBooking = async (id) => {
    setError('')
    setMessage('')

    try {
      await cancelBooking(id, userEmail)
      setMessage('Booking cancelled successfully.')
      loadBookings()
    } catch (cancelError) {
      setError(cancelError.message)
    }
  }

  const handleAdminDecision = async (id, status) => {
    const adminNote = window.prompt(`Optional note for ${status.toLowerCase()} decision:`) || ''
    setError('')
    setMessage('')

    try {
      await updateBookingStatus(id, { status, adminNote })
      setMessage(`Booking marked as ${status.toLowerCase()}.`)
      loadBookings()
    } catch (decisionError) {
      setError(decisionError.message)
    }
  }

  const canCancel = (booking) => {
    if (isAdmin) {
      return booking.status === 'PENDING' || booking.status === 'APPROVED'
    }

    return (booking.status === 'PENDING' || booking.status === 'APPROVED') && booking.requesterEmail === userEmail
  }

  return (
    <div className="min-h-screen bg-[#f5efe8] p-4 sm:p-6">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Booking Management</p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">Manage Campus Resource Bookings</h1>
            <p className="mt-2 text-sm text-slate-600">Create new booking requests and track approval status from one place.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Back to Dashboard
            </button>
          </div>
        </header>

        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl bg-slate-900 p-4 text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Total</p>
            <p className="mt-2 text-3xl font-black">{bookingStats.total}</p>
          </article>
          <article className="rounded-2xl bg-amber-100 p-4 text-amber-900">
            <p className="text-xs uppercase tracking-[0.2em]">Pending</p>
            <p className="mt-2 text-3xl font-black">{bookingStats.pending}</p>
          </article>
          <article className="rounded-2xl bg-emerald-100 p-4 text-emerald-900">
            <p className="text-xs uppercase tracking-[0.2em]">Approved</p>
            <p className="mt-2 text-3xl font-black">{bookingStats.approved}</p>
          </article>
          <article className="rounded-2xl bg-rose-100 p-4 text-rose-900">
            <p className="text-xs uppercase tracking-[0.2em]">Rejected</p>
            <p className="mt-2 text-3xl font-black">{bookingStats.rejected}</p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-xl font-black text-slate-900">New Booking Request</h2>

            <form onSubmit={handleCreateBooking} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Resource Type</label>
                <select
                  name="resourceType"
                  value={formData.resourceType}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-200 focus:ring-4"
                >
                  {resourceTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Resource Name</label>
                <input
                  name="resourceName"
                  value={formData.resourceName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-200 focus:ring-4"
                  placeholder="Ex: Lab B-204"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Purpose</label>
                <textarea
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-200 focus:ring-4"
                  placeholder="Ex: Group presentation rehearsal"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Date</label>
                  <input
                    type="date"
                    name="bookingDate"
                    value={formData.bookingDate}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-200 focus:ring-4"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-200 focus:ring-4"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">End Time</label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-200 focus:ring-4"
                />
              </div>

              <button className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white hover:bg-orange-600">
                Submit Booking
              </button>
            </form>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black text-slate-900">Booking Requests</h2>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      statusFilter === status ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {message ? <p className="mb-3 rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
            {error ? <p className="mb-3 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

            {loading ? <p className="text-sm text-slate-500">Loading bookings...</p> : null}

            {!loading && bookings.length === 0 ? <p className="text-sm text-slate-500">No bookings found for this filter.</p> : null}

            <div className="space-y-3">
              {bookings.map((booking) => (
                <div key={booking.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{booking.resourceName}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${badgeStyles[booking.status] || 'bg-slate-200 text-slate-700'}`}>
                      {booking.status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-600">{booking.resourceType} | {booking.bookingDate} | {booking.startTime} - {booking.endTime}</p>
                  <p className="mt-1 text-sm text-slate-700">{booking.purpose}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Requested by: {booking.requesterName} ({booking.requesterItNumber})
                  </p>

                  {booking.adminNote ? (
                    <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">Note: {booking.adminNote}</p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {canCancel(booking) ? (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="rounded-lg border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        Cancel
                      </button>
                    ) : null}

                    {isAdmin && booking.status === 'PENDING' ? (
                      <>
                        <button
                          onClick={() => handleAdminDecision(booking.id, 'APPROVED')}
                          className="rounded-lg border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAdminDecision(booking.id, 'REJECTED')}
                          className="rounded-lg border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </div>
  )
}

export default Bookings
