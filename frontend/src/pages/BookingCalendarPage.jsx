import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { checkInBooking, getCalendarBookings } from '../api/bookingApi.js'
import { buildQrScanUrl } from '../utils/publicAppUrl.js'

const BookingCalendarPage = () => {
  const savedUser = localStorage.getItem('auth_user')
  const [bookings, setBookings] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const user = useMemo(() => (savedUser ? JSON.parse(savedUser) : null), [savedUser])
  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN'

  const buildQrImageUrl = (token) => {
    const scanUrl = buildQrScanUrl(token)
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(scanUrl)}`
  }

  const loadCalendar = useCallback(async () => {
    if (!user) {
      return
    }

    try {
      const data = await getCalendarBookings({
        email: isAdmin ? undefined : user.email,
      })
      setBookings(data)
    } catch (loadError) {
      setError(loadError.message)
    }
  }, [isAdmin, user])

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        void loadCalendar()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [loadCalendar, user])

  const grouped = useMemo(() => {
    return bookings.reduce((acc, booking) => {
      if (!acc[booking.bookingDate]) {
        acc[booking.bookingDate] = []
      }
      acc[booking.bookingDate].push(booking)
      return acc
    }, {})
  }, [bookings])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const onCheckIn = async (booking) => {
    const token = window.prompt('Enter QR token to check in', booking.qrToken || '') || ''
    if (!token) {
      return
    }

    try {
      await checkInBooking(booking.id, token)
      setMessage('Check-in successful.')
      loadCalendar()
    } catch (checkInError) {
      setError(checkInError.message)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-black text-slate-900">Booking Calendar</h1>
          <div className="flex gap-2 text-sm">
            {!isAdmin ? <Link to="/bookings/form" className="rounded-lg border border-slate-300 px-3 py-1.5">New Booking</Link> : null}
            {!isAdmin ? <Link to="/bookings/my" className="rounded-lg border border-slate-300 px-3 py-1.5">My Bookings</Link> : null}
            {isAdmin ? <Link to="/bookings/approval" className="rounded-lg border border-slate-300 px-3 py-1.5">Approvals</Link> : null}
          </div>
        </div>

        {message ? <p className="mb-3 rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mb-3 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

        <div className="space-y-4">
          {Object.entries(grouped).map(([date, dayBookings]) => (
            <div key={date} className="rounded-xl border border-slate-200 p-4">
              <h2 className="text-lg font-bold text-slate-900">{date}</h2>
              <div className="mt-3 space-y-2">
                {dayBookings.map((booking) => (
                  <div key={booking.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                    <p className="font-semibold text-slate-900">{booking.startTime} - {booking.endTime} | {booking.resourceName}</p>
                    <p className="text-slate-600">{booking.requesterName} | {booking.status}</p>
                    {booking.status === 'APPROVED' && booking.qrToken ? (
                      <div className="mt-2 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2">
                        <img
                          src={buildQrImageUrl(booking.qrToken)}
                          alt="QR code for check-in"
                          className="h-16 w-16 rounded-md border border-emerald-200 bg-white p-1"
                        />
                        <div className="text-xs text-emerald-800">
                          <p className="font-semibold">QR Check-in Ready</p>
                          <p>Use this token for verification.</p>
                        </div>
                      </div>
                    ) : null}
                    {booking.status === 'APPROVED' && booking.qrToken && !booking.checkedIn ? (
                      <button onClick={() => onCheckIn(booking)} className="mt-2 rounded-lg border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-700">QR Check-in</button>
                    ) : null}
                    {booking.checkedIn ? <p className="mt-1 text-xs text-emerald-700">Checked in at {booking.checkedInAt}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(grouped).length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No bookings available in the selected range.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default BookingCalendarPage
