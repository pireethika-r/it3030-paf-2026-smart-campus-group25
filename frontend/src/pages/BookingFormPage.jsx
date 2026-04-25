import { useMemo, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { createBooking } from '../api/bookingApi.js'

const resourceTypes = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT']

const initialForm = {
  resourceType: 'LECTURE_HALL',
  resourceName: '',
  purpose: '',
  bookingDate: '',
  startTime: '',
  endTime: '',
  recurrenceCount: 1,
}

const durationPresets = [30, 60, 90, 120]

const BookingFormPage = () => {
  const savedUser = localStorage.getItem('auth_user')
  const user = useMemo(() => (savedUser ? JSON.parse(savedUser) : null), [savedUser])
  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN'
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState([])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (isAdmin) {
    return <Navigate to="/bookings/approval" replace />
  }

  const recurrencePreview = (() => {
    if (!form.bookingDate) {
      return []
    }

    const count = Math.max(1, Math.min(Number(form.recurrenceCount) || 1, 12))
    const baseDate = new Date(`${form.bookingDate}T00:00:00`)
    return Array.from({ length: count }, (_, index) => {
      const nextDate = new Date(baseDate)
      nextDate.setDate(nextDate.getDate() + index * 7)
      return nextDate.toISOString().slice(0, 10)
    })
  })()

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')
    setSuggestions([])

    try {
      const response = await createBooking({
        requesterName: user.fullName || 'Student User',
        requesterEmail: user.email,
        requesterItNumber: user.itNumber || user.itNo || 'UNKNOWN',
        resourceType: form.resourceType,
        resourceName: form.resourceName.trim(),
        purpose: form.purpose.trim(),
        bookingDate: form.bookingDate,
        startTime: form.startTime,
        endTime: form.endTime,
        recurrenceCount: Number(form.recurrenceCount),
      })

      setMessage(response.message || 'Booking request created.')
      setForm(initialForm)
    } catch (submitError) {
      setError(submitError.message)
      setSuggestions(submitError.suggestions || [])
    }
  }

  const applyDuration = (minutes) => {
    if (!form.startTime) {
      return
    }

    const [hours, mins] = form.startTime.split(':').map(Number)
    const total = hours * 60 + mins + minutes
    const bounded = Math.min(total, 23 * 60 + 59)
    const endHour = String(Math.floor(bounded / 60)).padStart(2, '0')
    const endMinute = String(bounded % 60).padStart(2, '0')

    setForm((prev) => ({ ...prev, endTime: `${endHour}:${endMinute}` }))
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-black text-slate-900">Booking Form</h1>
          <div className="flex gap-2 text-sm">
            <Link to="/bookings/my" className="rounded-lg border border-slate-300 px-3 py-1.5">My Bookings</Link>
            <Link to="/bookings/calendar" className="rounded-lg border border-slate-300 px-3 py-1.5">Calendar</Link>
            <Link to="/dashboard" className="rounded-lg border border-slate-300 px-3 py-1.5">Dashboard</Link>
          </div>
        </div>

        <form onSubmit={onSubmit} className="grid gap-3">
          <select name="resourceType" value={form.resourceType} onChange={onChange} className="rounded-xl border border-slate-300 px-3 py-2">
            {resourceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>

          <input name="resourceName" value={form.resourceName} onChange={onChange} required placeholder="Resource name" className="rounded-xl border border-slate-300 px-3 py-2" />
          <textarea name="purpose" value={form.purpose} onChange={onChange} required rows={3} placeholder="Purpose" className="rounded-xl border border-slate-300 px-3 py-2" />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input type="date" name="bookingDate" value={form.bookingDate} onChange={onChange} required className="rounded-xl border border-slate-300 px-3 py-2" />
            <input type="time" name="startTime" value={form.startTime} onChange={onChange} required className="rounded-xl border border-slate-300 px-3 py-2" />
            <input type="time" name="endTime" value={form.endTime} onChange={onChange} required className="rounded-xl border border-slate-300 px-3 py-2" />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Quick duration</p>
            <div className="flex flex-wrap gap-2">
              {durationPresets.map((duration) => (
                <button
                  key={duration}
                  type="button"
                  onClick={() => applyDuration(duration)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  +{duration} min
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Recurring booking count (weekly)</label>
            <input type="number" min="1" max="12" name="recurrenceCount" value={form.recurrenceCount} onChange={onChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
          </div>

          {recurrencePreview.length > 1 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recurring preview</p>
              <p className="mt-2 text-sm text-slate-700">This booking will be created on:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {recurrencePreview.map((date) => (
                  <span key={date} className="rounded-lg bg-white px-2 py-1 text-xs text-slate-700 ring-1 ring-slate-200">
                    {date}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <button className="rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white">Create Booking</button>
        </form>

        {message ? <p className="mt-4 rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-4 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

        {suggestions.length > 0 ? (
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-semibold">Suggested alternative slots:</p>
            <ul className="mt-2 list-disc pl-5">
              {suggestions.map((slot) => <li key={slot}>{slot}</li>)}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default BookingFormPage
