import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  approveBooking,
  cancelBooking,
  createBooking,
  deleteBooking,
  getAdminAnalytics,
  getBookings,
  rejectBooking,
  updateBooking,
  verifyStudentForAdmin,
} from '../api/bookingApi.js'

const statusBadge = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-rose-100 text-rose-800',
  CANCELLED: 'bg-slate-200 text-slate-700',
}

const initialAdminCreate = {
  requesterName: '',
  requesterEmail: '',
  requesterItNumber: '',
  resourceType: 'LECTURE_HALL',
  resourceName: '',
  purpose: '',
  bookingDate: '',
  startTime: '',
  endTime: '',
  recurrenceCount: 1,
}

const resourceTypes = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT']

const BookingApprovalPage = () => {
  const savedUser = localStorage.getItem('auth_user')
  const [bookings, setBookings] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [query, setQuery] = useState('')
  const [adminCreateForm, setAdminCreateForm] = useState(initialAdminCreate)
  const [analytics, setAnalytics] = useState(null)
  const [studentVerified, setStudentVerified] = useState(false)
  const [verifyingStudent, setVerifyingStudent] = useState(false)
  const [verifiedStudentKey, setVerifiedStudentKey] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const user = useMemo(() => (savedUser ? JSON.parse(savedUser) : null), [savedUser])
  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN'

  const loadBookings = useCallback(async () => {
    if (!isAdmin) {
      return
    }

    try {
      const [bookingsData, analyticsData] = await Promise.all([
        getBookings(),
        getAdminAnalytics(),
      ])
      setBookings(bookingsData)
      setAnalytics(analyticsData)
    } catch (loadError) {
      setError(loadError.message)
    }
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin) {
      const timer = setTimeout(() => {
        void loadBookings()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isAdmin, loadBookings])

  const onApprove = async (id) => {
    const note = window.prompt('Approval note (optional)') || ''
    try {
      await approveBooking(id, note)
      setMessage('Booking approved.')
      void loadBookings()
    } catch (approveError) {
      setError(approveError.message)
    }
  }

  const onReject = async (id) => {
    const note = window.prompt('Rejection reason (optional)') || ''
    try {
      await rejectBooking(id, note)
      setMessage('Booking rejected.')
      void loadBookings()
    } catch (rejectError) {
      setError(rejectError.message)
    }
  }

  const getStudentIdentityKey = (form) => {
    const name = form.requesterName.trim().toLowerCase()
    const email = form.requesterEmail.trim().toLowerCase()
    const itNumber = form.requesterItNumber.trim().toUpperCase()
    return `${name}|${email}|${itNumber}`
  }

  const onCreateForStudent = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!studentVerified) {
      setError('Please verify student details before creating booking.')
      return
    }

    try {
      const response = await createBooking({
        ...adminCreateForm,
        requesterName: adminCreateForm.requesterName.trim(),
        requesterEmail: adminCreateForm.requesterEmail.trim(),
        requesterItNumber: adminCreateForm.requesterItNumber.trim(),
        resourceName: adminCreateForm.resourceName.trim(),
        purpose: adminCreateForm.purpose.trim(),
        recurrenceCount: Number(adminCreateForm.recurrenceCount),
      })
      const createdCount = Array.isArray(response?.createdBookings) ? response.createdBookings.length : 0
      const successMessage = response?.message || 'Booking created successfully.'
      setMessage(createdCount > 0 ? `${successMessage} (${createdCount} booking${createdCount > 1 ? 's' : ''})` : successMessage)
      setAdminCreateForm(initialAdminCreate)
      setStudentVerified(false)
      setVerifiedStudentKey('')
      void loadBookings()
    } catch (createError) {
      setError(`Booking creation unsuccessful: ${createError.message}`)
    }
  }

  const onVerifyStudent = async ({ auto = false } = {}) => {
    setMessage('')
    setError('')

    const requesterName = adminCreateForm.requesterName.trim()
    const requesterEmail = adminCreateForm.requesterEmail.trim()
    const requesterItNumber = adminCreateForm.requesterItNumber.trim()

    if (!requesterName || !requesterEmail || !requesterItNumber) {
      setStudentVerified(false)
      if (!auto) {
        setError('Enter student name, email, and IT number before verification.')
      }
      return
    }

    const currentIdentityKey = getStudentIdentityKey(adminCreateForm)
    if (auto && (verifyingStudent || (studentVerified && verifiedStudentKey === currentIdentityKey))) {
      return
    }

    try {
      setVerifyingStudent(true)
      const data = await verifyStudentForAdmin({ requesterName, requesterEmail, requesterItNumber })
      setAdminCreateForm((prev) => ({
        ...prev,
        requesterName: data.fullName || requesterName,
        requesterEmail: data.email || requesterEmail,
        requesterItNumber: data.itNumber || requesterItNumber,
      }))
      const verifiedKey = getStudentIdentityKey({
        requesterName: data.fullName || requesterName,
        requesterEmail: data.email || requesterEmail,
        requesterItNumber: data.itNumber || requesterItNumber,
      })
      setVerifiedStudentKey(verifiedKey)
      setStudentVerified(true)
      setMessage(auto ? 'Student auto-verified successfully.' : (data.message || 'Student verified successfully.'))
    } catch (verifyError) {
      setStudentVerified(false)
      setVerifiedStudentKey('')
      setError(`Student verification unsuccessful: ${verifyError.message}`)
    } finally {
      setVerifyingStudent(false)
    }
  }

  const onStudentIdentityChange = (field, value) => {
    setStudentVerified(false)
    setVerifiedStudentKey('')
    setAdminCreateForm((prev) => ({ ...prev, [field]: value }))
  }

  const onStudentIdentityBlur = () => {
    void onVerifyStudent({ auto: true })
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

  const onEditSave = async (booking) => {
    if (!editForm) {
      return
    }

    try {
      await updateBooking(booking.id, booking.requesterEmail, editForm)
      setMessage('Booking updated by admin.')
      setEditingId(null)
      setEditForm(null)
      void loadBookings()
    } catch (updateError) {
      setError(updateError.message)
    }
  }

  const onCancel = async (booking) => {
    try {
      await cancelBooking(booking.id, booking.requesterEmail)
      setMessage('Booking cancelled by admin.')
      void loadBookings()
    } catch (cancelError) {
      setError(cancelError.message)
    }
  }

  const onDelete = async (booking) => {
    try {
      await deleteBooking(booking.id, booking.requesterEmail)
      setMessage('Booking deleted by admin.')
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
        booking.requesterName.toLowerCase().includes(search) ||
        booking.requesterEmail.toLowerCase().includes(search)

      return matchesStatus && matchesQuery
    })
  }, [bookings, query, statusFilter])

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter((booking) => booking.status === 'PENDING').length,
      approved: bookings.filter((booking) => booking.status === 'APPROVED').length,
      rejected: bookings.filter((booking) => booking.status === 'REJECTED').length,
      cancelled: bookings.filter((booking) => booking.status === 'CANCELLED').length,
    }
  }, [bookings])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/bookings/my" replace />
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-black text-slate-900">Booking Approval (Admin)</h1>
          <div className="flex gap-2 text-sm">
            <Link to="/bookings/calendar" className="rounded-lg border border-slate-300 px-3 py-1.5">Calendar</Link>
            <Link to="/dashboard" className="rounded-lg border border-slate-300 px-3 py-1.5">Dashboard</Link>
          </div>
        </div>

        {message ? <p className="mb-3 rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mb-3 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <div className="rounded-xl bg-slate-100 p-3 text-center"><p className="text-xs text-slate-500">Total</p><p className="text-lg font-bold text-slate-900">{stats.total}</p></div>
          <div className="rounded-xl bg-amber-100 p-3 text-center"><p className="text-xs text-amber-700">Pending</p><p className="text-lg font-bold text-amber-900">{stats.pending}</p></div>
          <div className="rounded-xl bg-emerald-100 p-3 text-center"><p className="text-xs text-emerald-700">Approved</p><p className="text-lg font-bold text-emerald-900">{stats.approved}</p></div>
          <div className="rounded-xl bg-rose-100 p-3 text-center"><p className="text-xs text-rose-700">Rejected</p><p className="text-lg font-bold text-rose-900">{stats.rejected}</p></div>
          <div className="rounded-xl bg-slate-200 p-3 text-center"><p className="text-xs text-slate-600">Cancelled</p><p className="text-lg font-bold text-slate-800">{stats.cancelled}</p></div>
        </div>

        {analytics ? (
          <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-900">Admin Analytics ({analytics.periodLabel})</p>
              <p className="text-xs text-slate-500">Innovation: Smart Insights + Ops Metrics</p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              <div className="rounded-lg bg-white p-3 text-center ring-1 ring-slate-200"><p className="text-xs text-slate-500">Approval Rate</p><p className="text-lg font-bold text-emerald-700">{analytics.approvalRate}%</p></div>
              <div className="rounded-lg bg-white p-3 text-center ring-1 ring-slate-200"><p className="text-xs text-slate-500">Avg Decision</p><p className="text-lg font-bold text-indigo-700">{analytics.averageDecisionHours}h</p></div>
              <div className="rounded-lg bg-white p-3 text-center ring-1 ring-slate-200"><p className="text-xs text-slate-500">Urgent Pending</p><p className="text-lg font-bold text-rose-700">{analytics.urgentPendingRequests}</p></div>
              <div className="rounded-lg bg-white p-3 text-center ring-1 ring-slate-200"><p className="text-xs text-slate-500">Month Total</p><p className="text-lg font-bold text-slate-900">{analytics.totalRequests}</p></div>
              <div className="rounded-lg bg-white p-3 text-center ring-1 ring-slate-200"><p className="text-xs text-slate-500">Approved</p><p className="text-lg font-bold text-emerald-700">{analytics.approvedRequests}</p></div>
              <div className="rounded-lg bg-white p-3 text-center ring-1 ring-slate-200"><p className="text-xs text-slate-500">Rejected</p><p className="text-lg font-bold text-amber-700">{analytics.rejectedRequests}</p></div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top Requested Resources</p>
                <div className="mt-2 space-y-2">
                  {(analytics.topResources || []).map((item) => (
                    <div key={item.resourceName} className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1">
                      <span className="text-sm text-slate-700">{item.resourceName}</span>
                      <span className="text-xs font-bold text-slate-900">{item.totalRequests}</span>
                    </div>
                  ))}
                  {(analytics.topResources || []).length === 0 ? <p className="text-sm text-slate-500">No resource demand data yet.</p> : null}
                </div>
              </div>

              <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Weekly Request Trend</p>
                <div className="mt-2 space-y-2">
                  {(analytics.weeklyTrend || []).map((point) => {
                    const barWidth = Math.min(100, (point.total || 0) * 20)
                    return (
                      <div key={point.date} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span>{point.date}</span>
                          <span>Total {point.total} | P {point.pending} | A {point.approved}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div style={{ width: `${barWidth}%` }} className="h-2 rounded-full bg-linear-to-r from-indigo-600 to-cyan-500" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <form onSubmit={onCreateForStudent} className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-900">Create Booking For Student</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <input required value={adminCreateForm.requesterName} onChange={(event) => onStudentIdentityChange('requesterName', event.target.value)} onBlur={onStudentIdentityBlur} placeholder="Student Name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input required value={adminCreateForm.requesterEmail} onChange={(event) => onStudentIdentityChange('requesterEmail', event.target.value)} onBlur={onStudentIdentityBlur} placeholder="Student Email" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input required value={adminCreateForm.requesterItNumber} onChange={(event) => onStudentIdentityChange('requesterItNumber', event.target.value)} onBlur={onStudentIdentityBlur} placeholder="Student IT Number" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <select value={adminCreateForm.resourceType} onChange={(event) => setAdminCreateForm((prev) => ({ ...prev, resourceType: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {resourceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <input required value={adminCreateForm.resourceName} onChange={(event) => setAdminCreateForm((prev) => ({ ...prev, resourceName: event.target.value }))} placeholder="Resource Name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input required value={adminCreateForm.purpose} onChange={(event) => setAdminCreateForm((prev) => ({ ...prev, purpose: event.target.value }))} placeholder="Purpose" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input required type="date" value={adminCreateForm.bookingDate} onChange={(event) => setAdminCreateForm((prev) => ({ ...prev, bookingDate: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input required type="time" value={adminCreateForm.startTime} onChange={(event) => setAdminCreateForm((prev) => ({ ...prev, startTime: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input required type="time" value={adminCreateForm.endTime} onChange={(event) => setAdminCreateForm((prev) => ({ ...prev, endTime: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input min="1" max="12" type="number" value={adminCreateForm.recurrenceCount} onChange={(event) => setAdminCreateForm((prev) => ({ ...prev, recurrenceCount: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => void onVerifyStudent()} disabled={verifyingStudent} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              {verifyingStudent ? 'Verifying...' : 'Verify Student'}
            </button>
            <button disabled={!studentVerified} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">Create As Admin</button>
            <span className={`text-xs font-semibold ${studentVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
              {studentVerified ? 'Student verified' : 'Verification required before create'}
            </span>
          </div>
        </form>

        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by student, resource, purpose" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button onClick={() => void loadBookings()} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Refresh</button>
        </div>

        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="rounded-xl border border-slate-200 p-4">
              <p className="font-bold text-slate-900">
                {booking.resourceName}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge[booking.status] || 'bg-slate-100 text-slate-700'}`}>{booking.status}</span>
                {booking.riskLevel ? (
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${booking.riskLevel === 'HIGH' ? 'bg-rose-100 text-rose-700' : booking.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    Risk {booking.riskLevel} ({booking.riskScore})
                  </span>
                ) : null}
              </p>
              <p className="text-sm text-slate-600">{booking.bookingDate} | {booking.startTime} - {booking.endTime}</p>
              <p className="text-sm text-slate-700">{booking.purpose}</p>
              <p className="text-xs text-slate-500">{booking.requesterName} ({booking.requesterItNumber})</p>
              <p className="text-xs text-slate-500">{booking.requesterEmail}</p>
              {booking.recommendedAction ? (
                <p className="mt-1 text-xs font-semibold text-indigo-700">Suggested Action: {booking.recommendedAction}</p>
              ) : null}
              {(booking.riskReasons || []).length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {booking.riskReasons.slice(0, 3).map((reason) => (
                    <span key={`${booking.id}-${reason}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{reason}</span>
                  ))}
                </div>
              ) : null}

              <div className="mt-3 flex gap-2">
                {booking.status === 'PENDING' ? <button onClick={() => onApprove(booking.id)} className="rounded-lg border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-700">Approve</button> : null}
                {booking.status === 'PENDING' ? <button onClick={() => onReject(booking.id)} className="rounded-lg border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700">Reject</button> : null}
                {booking.status === 'PENDING' ? <button onClick={() => onEditClick(booking)} className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold">Edit</button> : null}
                {(booking.status === 'PENDING' || booking.status === 'APPROVED') ? <button onClick={() => onCancel(booking)} className="rounded-lg border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-700">Cancel</button> : null}
                {(booking.status === 'REJECTED' || booking.status === 'CANCELLED') ? <button onClick={() => onDelete(booking)} className="rounded-lg border border-slate-400 px-3 py-1 text-xs font-semibold text-slate-700">Delete</button> : null}
              </div>

              {editingId === booking.id && editForm ? (
                <div className="mt-4 grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
                  <input value={editForm.resourceName} onChange={(event) => setEditForm((prev) => ({ ...prev, resourceName: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Resource" />
                  <input value={editForm.resourceType} onChange={(event) => setEditForm((prev) => ({ ...prev, resourceType: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Type" />
                  <input type="date" value={editForm.bookingDate} onChange={(event) => setEditForm((prev) => ({ ...prev, bookingDate: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="time" value={editForm.startTime} onChange={(event) => setEditForm((prev) => ({ ...prev, startTime: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    <input type="time" value={editForm.endTime} onChange={(event) => setEditForm((prev) => ({ ...prev, endTime: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </div>
                  <textarea value={editForm.purpose} onChange={(event) => setEditForm((prev) => ({ ...prev, purpose: event.target.value }))} rows={2} className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Purpose" />
                  <div className="sm:col-span-2 flex gap-2">
                    <button onClick={() => onEditSave(booking)} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">Save</button>
                    <button onClick={() => { setEditingId(null); setEditForm(null) }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold">Close</button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}

          {filteredBookings.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No bookings found for your current filters.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default BookingApprovalPage
