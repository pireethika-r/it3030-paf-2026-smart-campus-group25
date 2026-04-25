import { Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import logo from '../assets/edutrack.png'
import { getAuthUser } from '../auth/roles.js'
import { API_BASE_URL } from '../config.js'
import { getMyBookings } from '../api/bookingApi.js'
import { getMyTickets, getTicketNotifications, markTicketNotificationAsRead } from '../api/ticketApi.js'
import { updateOwnProfile, deleteOwnProfile } from '../api/authApi.js'

const NOTIFICATION_API_URL = `${API_BASE_URL}/api/auth/notification-preferences`
const notificationCategoryLabels = {
  BOOKING_UPDATES: 'Booking Updates',
  MAINTENANCE_ALERTS: 'Maintenance Alerts',
  SYSTEM_ANNOUNCEMENTS: 'System Announcements',
  SECURITY_NOTICES: 'Security Notices',
}

const todayTasks = [
  { name: 'Projector fault - Hall A3', detail: 'Assigned to technician', color: 'bg-orange-500' },
  { name: 'Computer Lab B booking', detail: 'Pending admin approval', color: 'bg-violet-700' },
  { name: 'Mic set replacement', detail: 'Resolved and closed', color: 'bg-cyan-500' },
]

const calendarItems = [
  { time: '10:00', title: 'Lab C2 Inspection', subtitle: 'Maintenance' },
  { time: '13:20', title: 'Room 402 Booking', subtitle: 'Faculty Request' },
  { time: '15:00', title: 'Asset Audit Update', subtitle: 'Admin Workflow' },
]

const Dashboard = () => {
  const navigate = useNavigate()
  const user = getAuthUser()
  const [activeSection, setActiveSection] = useState('Dashboard')
  const [bookings, setBookings] = useState([])
  const [bookingError, setBookingError] = useState('')
  const [isBookingsLoading, setIsBookingsLoading] = useState(false)
  const [tickets, setTickets] = useState([])
  const [ticketError, setTicketError] = useState('')
  const [isTicketsLoading, setIsTicketsLoading] = useState(false)
  const [bookingNotifications, setBookingNotifications] = useState([])
  const [ticketNotifications, setTicketNotifications] = useState([])
  const [notificationPreferences, setNotificationPreferences] = useState({})
  const [notificationStatus, setNotificationStatus] = useState('')
  const [isNotificationLoading, setIsNotificationLoading] = useState(false)
  const [isNotificationSaving, setIsNotificationSaving] = useState(false)
  const [ticketNotificationError, setTicketNotificationError] = useState('')
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    itNumber: user?.itNumber || user?.itNo || '',
    email: user?.email || '',
  })
  const [profileStatus, setProfileStatus] = useState('')
  const [isProfileSaving, setIsProfileSaving] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeletingProfile, setIsDeletingProfile] = useState(false)

  const bookingUpdatesEnabled = notificationPreferences.BOOKING_UPDATES !== false
  const pendingRequests = bookings.filter((booking) => booking.status === 'PENDING')
  const approvedBookings = bookings.filter((booking) => booking.status === 'APPROVED')
  const activeTickets = tickets.filter((ticket) => ['OPEN', 'IN_PROGRESS', 'AWAITING_FOR_REPLY'].includes(ticket.status))
  const resolvedTickets = tickets.filter((ticket) => ['RESOLVED', 'CLOSED'].includes(ticket.status))
  const unreadTicketNotificationCount = ticketNotifications.filter((item) => !item.read).length

  const taskCards = [
    {
      title: 'My booking requests',
      items: `${pendingRequests.length} active request${pendingRequests.length === 1 ? '' : 's'}`,
      progress: bookings.length === 0 ? '0%' : `${Math.round((pendingRequests.length / bookings.length) * 100)}%`,
      color: 'bg-violet-700',
      accent: 'bg-violet-200',
    },
    {
      title: 'My bookings',
      items: `${approvedBookings.length} approved booking${approvedBookings.length === 1 ? '' : 's'}`,
      progress: bookings.length === 0 ? '0%' : `${Math.round((approvedBookings.length / bookings.length) * 100)}%`,
      color: 'bg-emerald-600',
      accent: 'bg-emerald-200',
    },
    {
      title: 'Total records',
      items: `${bookings.length} booking item${bookings.length === 1 ? '' : 's'}`,
      progress: '100%',
      color: 'bg-cyan-500',
      accent: 'bg-cyan-200',
    },
  ]

  const ticketCards = [
    {
      title: 'My ticket requests',
      items: `${activeTickets.length} active request${activeTickets.length === 1 ? '' : 's'}`,
      progress: tickets.length === 0 ? '0%' : `${Math.round((activeTickets.length / tickets.length) * 100)}%`,
      color: 'bg-violet-700',
      accent: 'bg-violet-200',
    },
    {
      title: 'Resolved tickets',
      items: `${resolvedTickets.length} resolved ticket${resolvedTickets.length === 1 ? '' : 's'}`,
      progress: tickets.length === 0 ? '0%' : `${Math.round((resolvedTickets.length / tickets.length) * 100)}%`,
      color: 'bg-emerald-600',
      accent: 'bg-emerald-200',
    },
    {
      title: 'Total ticket records',
      items: `${tickets.length} ticket item${tickets.length === 1 ? '' : 's'}`,
      progress: '100%',
      color: 'bg-cyan-500',
      accent: 'bg-cyan-200',
    },
  ]

  const loadBookings = async () => {
    if (!user?.email) {
      return
    }

    setIsBookingsLoading(true)
    setBookingError('')

    try {
      const data = await getMyBookings(user.email)
      setBookings(Array.isArray(data) ? data : [])
    } catch (error) {
      setBookingError(error.message || 'Failed to load your bookings.')
    } finally {
      setIsBookingsLoading(false)
    }
  }

  const loadTickets = async () => {
    if (!user?.email) {
      return
    }

    setIsTicketsLoading(true)
    setTicketError('')

    try {
      const data = await getMyTickets()
      setTickets(Array.isArray(data) ? data : [])
    } catch (error) {
      setTicketError(error.message || 'Failed to load your tickets.')
    } finally {
      setIsTicketsLoading(false)
    }
  }

  const fetchNotificationPreferences = async () => {
    if (!user?.email) {
      return
    }

    setIsNotificationLoading(true)
    setNotificationStatus('')
    try {
      const response = await fetch(`${NOTIFICATION_API_URL}?email=${encodeURIComponent(user.email)}`)
      const data = await response.json()

      if (!response.ok) {
        setNotificationStatus(data.message || 'Failed to load notification preferences.')
        return
      }

      setNotificationPreferences(data.preferences || {})
    } catch {
      setNotificationStatus('Cannot connect to server. Please start backend and try again.')
    } finally {
      setIsNotificationLoading(false)
    }
  }

  const fetchTicketNotifications = async () => {
    if (!user?.email) {
      return
    }

    setTicketNotificationError('')
    try {
      const data = await getTicketNotifications()
      setTicketNotifications(Array.isArray(data) ? data : [])
    } catch (error) {
      setTicketNotificationError(error.message || 'Failed to load ticket notifications.')
    }
  }

  useEffect(() => {
    if (user?.email) {
      fetchNotificationPreferences()
      void fetchTicketNotifications()
      void loadBookings()
      void loadTickets()
    }
  }, [user?.email])

  const handleReadTicketNotification = async (notificationId) => {
    try {
      await markTicketNotificationAsRead(notificationId)
      setTicketNotifications((prev) => prev.map((item) => (
        item.id === notificationId
          ? { ...item, read: true }
          : item
      )))
    } catch {
      // Ignore temporary failures for read state changes.
    }
  }

  useEffect(() => {
    if (!user?.email) {
      return
    }

    const storageKey = `seen_approved_bookings_${user.email.toLowerCase()}`
    const seenApprovedIds = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]'))
    const latestApproved = approvedBookings.filter((booking) => !seenApprovedIds.has(String(booking.id)))

    if (latestApproved.length > 0 && bookingUpdatesEnabled) {
      const latestNotifications = latestApproved.map((booking) => ({
        id: `approved-${booking.id}`,
        title: 'Booking Approved',
        detail: `${booking.resourceName} on ${booking.bookingDate} (${booking.startTime} - ${booking.endTime})`,
      }))
      setBookingNotifications((prev) => {
        const known = new Set(prev.map((item) => item.id))
        const merged = [...prev]
        latestNotifications.forEach((item) => {
          if (!known.has(item.id)) {
            merged.unshift(item)
          }
        })
        return merged.slice(0, 8)
      })
    }

    localStorage.setItem(storageKey, JSON.stringify(approvedBookings.map((booking) => String(booking.id))))
  }, [approvedBookings, bookingUpdatesEnabled, user?.email])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const userItNumber = user.itNumber || user.itNo || localStorage.getItem('auth_it_number') || 'IT Number'

  const handleNotificationToggle = (category) => {
    setNotificationStatus('')
    setNotificationPreferences((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  const handleSaveNotificationPreferences = async () => {
    if (!user?.email) {
      return
    }

    setIsNotificationSaving(true)
    setNotificationStatus('')

    try {
      const response = await fetch(NOTIFICATION_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          preferences: notificationPreferences,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setNotificationStatus(data.message || 'Failed to save notification preferences.')
        return
      }

      setNotificationPreferences(data.preferences || {})
      setNotificationStatus('Notification preferences saved.')
    } catch {
      setNotificationStatus('Cannot connect to server. Please start backend and try again.')
    } finally {
      setIsNotificationSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_user')
    navigate('/login')
  }

  const handleProfileFieldChange = (field, value) => {
    setProfileStatus('')
    setProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSaveProfile = async () => {
    if (!user?.email) {
      return
    }

    const payload = {
      currentEmail: user.email,
      fullName: profileForm.fullName.trim(),
      itNumber: profileForm.itNumber.trim().toUpperCase(),
      email: profileForm.email.trim().toLowerCase(),
    }

    if (!payload.fullName || !payload.itNumber || !payload.email) {
      setProfileStatus('All profile fields are required.')
      return
    }

    setIsProfileSaving(true)
    setProfileStatus('')
    try {
      const data = await updateOwnProfile(payload)
      const nextUser = {
        email: data.email,
        itNumber: data.itNumber,
        itNo: data.itNumber,
        fullName: data.fullName,
        role: data.role || user.role || 'USER',
      }

      localStorage.setItem('auth_user', JSON.stringify(nextUser))
      localStorage.setItem('auth_it_number', data.itNumber)
      setProfileForm({
        fullName: data.fullName,
        itNumber: data.itNumber,
        email: data.email,
      })
      setProfileStatus('Profile updated successfully.')
    } catch (error) {
      setProfileStatus(error.message || 'Failed to update profile.')
    } finally {
      setIsProfileSaving(false)
    }
  }

  const handleDeleteProfile = async () => {
    if (!user?.email) {
      return
    }

    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setProfileStatus('Type DELETE to confirm profile deletion.')
      return
    }

    setIsDeletingProfile(true)
    setProfileStatus('')
    try {
      await deleteOwnProfile(user.email)
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_it_number')
      navigate('/login', { replace: true })
    } catch (error) {
      setProfileStatus(error.message || 'Failed to delete profile.')
    } finally {
      setIsDeletingProfile(false)
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#f5efe8] p-2 sm:p-3 lg:p-4">
      <div className="grid h-full w-full gap-3 rounded-[2rem] bg-slate-50 p-3 shadow-2xl lg:grid-cols-[260px_minmax(0,1fr)_280px] lg:p-4">
        <aside className="overflow-auto rounded-[1.5rem] border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="EduTrack logo" className="h-10 w-10 rounded-xl object-cover shadow" />
            <div>
              <h2 className="text-2xl font-black text-slate-900">EduTrack</h2>
              <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">User Portal</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-gradient-to-br from-cyan-100 to-violet-100 p-4">
            <p className="text-xs uppercase text-slate-500">Logged in as</p>
            <p className="mt-1 text-[1.85rem] font-bold leading-tight text-slate-900 break-words">{user.fullName || 'User'}</p>
            <p className="text-sm text-slate-600 break-all">{user.email}</p>
            <p className="mt-2 inline-flex rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700">{user.role || 'USER'}</p>
          </div>

          <nav className="mt-8 space-y-2 text-sm font-semibold text-slate-600">
            {['Dashboard', 'My Bookings', 'My Requests', 'Ticket', 'Notifications', 'Profile'].map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => {
                  if (section === 'Ticket') {
                    setActiveSection('Ticket')
                    navigate('/tickets/my')
                    return
                  }

                  setActiveSection(section)
                }}
                className={`w-full rounded-xl px-4 py-3 text-left ${activeSection === section ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`}
              >
                {section}
              </button>
            ))}
          </nav>

          <button onClick={handleLogout} className="mt-10 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Logout
          </button>
        </aside>

        <main className="overflow-auto rounded-[1.5rem] bg-white p-6">
          <nav className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <img src={logo} alt="EduTrack logo" className="h-9 w-9 rounded-lg object-cover" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">University Operations</p>
                <p className="text-sm font-bold text-slate-800">Bookings, incidents, and audits in one place</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSection('Notifications')}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Notifications {unreadTicketNotificationCount > 0 ? `(${unreadTicketNotificationCount})` : ''}
              </button>
              <button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Quick Actions</button>
            </div>
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-slate-900">Hello, {userItNumber}</h1>
              <p className="text-sm text-slate-500">Your bookings, requests, and status updates at a glance.</p>
            </div>
          </div>

          {isBookingsLoading ? <p className="mt-4 text-sm text-slate-500">Loading your bookings...</p> : null}
          {bookingError ? <p className="mt-4 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{bookingError}</p> : null}
          {isTicketsLoading ? <p className="mt-2 text-sm text-slate-500">Loading your tickets...</p> : null}
          {ticketError ? <p className="mt-2 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{ticketError}</p> : null}

          {bookingNotifications.length > 0 && bookingUpdatesEnabled ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm font-bold text-emerald-800">Booking Approved Notification</p>
              <p className="text-sm text-emerald-700">You have {bookingNotifications.length} approved booking update{bookingNotifications.length === 1 ? '' : 's'}.</p>
            </div>
          ) : null}

          {activeSection === 'My Bookings' ? (
            <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-lg font-black text-slate-900">My Bookings (Approved)</h2>
              {approvedBookings.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No approved bookings yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {approvedBookings.slice(0, 6).map((booking) => (
                    <div key={booking.id} className="rounded-xl border border-emerald-200 bg-white px-3 py-2">
                      <p className="font-semibold text-slate-900">{booking.resourceName}</p>
                      <p className="text-sm text-slate-600">{booking.bookingDate} | {booking.startTime} - {booking.endTime}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {activeSection === 'My Requests' ? (
            <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-lg font-black text-slate-900">My Requests (Pending)</h2>
              {pendingRequests.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No pending requests.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {pendingRequests.slice(0, 6).map((booking) => (
                    <div key={booking.id} className="rounded-xl border border-amber-200 bg-white px-3 py-2">
                      <p className="font-semibold text-slate-900">{booking.resourceName}</p>
                      <p className="text-sm text-slate-600">{booking.bookingDate} | {booking.startTime} - {booking.endTime}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {activeSection === 'Notifications' ? (
            <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-lg font-black text-slate-900">My Notifications</h2>
              {ticketNotificationError ? <p className="mt-3 text-sm text-rose-700">{ticketNotificationError}</p> : null}
              {ticketNotifications.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No ticket notifications yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {ticketNotifications.map((notification) => (
                    <div key={notification.id} className={`rounded-xl border bg-white px-3 py-2 ${notification.read ? 'border-slate-200' : 'border-cyan-200'}`}>
                      <p className={`text-sm font-bold ${notification.read ? 'text-slate-900' : 'text-cyan-900'}`}>{notification.title}</p>
                      <p className="text-sm text-slate-700">{notification.message}</p>
                      <p className="mt-1 text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString()}</p>
                      {!notification.read ? (
                        <button
                          type="button"
                          onClick={() => handleReadTicketNotification(notification.id)}
                          className="mt-2 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Mark as read
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {activeSection === 'Notifications' ? (
            <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Notification Preferences</h2>
                  <p className="text-sm text-slate-500">Enable or disable categories for your account notifications.</p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveNotificationPreferences}
                  disabled={isNotificationSaving || isNotificationLoading}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isNotificationSaving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>

              {notificationStatus ? <p className="mt-3 text-sm text-slate-700">{notificationStatus}</p> : null}

              {isNotificationLoading ? (
                <p className="mt-3 text-sm text-slate-500">Loading notification preferences...</p>
              ) : (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {Object.keys(notificationCategoryLabels).map((category) => {
                    const isEnabled = Boolean(notificationPreferences[category])
                    return (
                      <label key={category} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <span className="text-sm font-semibold text-slate-700">{notificationCategoryLabels[category]}</span>
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => handleNotificationToggle(category)}
                          className="h-5 w-5 accent-slate-900"
                        />
                      </label>
                    )
                  })}
                </div>
              )}
            </section>
          ) : null}

          {activeSection === 'Profile' ? (
            <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-lg font-black text-slate-900">My Profile</h2>
              <p className="mt-1 text-sm text-slate-500">Update your account details or permanently delete your profile.</p>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Full Name
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(event) => handleProfileFieldChange('fullName', event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </label>

                <label className="text-sm font-semibold text-slate-700">
                  IT Number
                  <input
                    type="text"
                    value={profileForm.itNumber}
                    onChange={(event) => handleProfileFieldChange('itNumber', event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </label>

                <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                  Email
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(event) => handleProfileFieldChange('email', event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isProfileSaving || isDeletingProfile}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isProfileSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>

              <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm font-bold text-rose-900">Delete Profile</p>
                <p className="mt-1 text-sm text-rose-800">This action is permanent. Type DELETE and confirm.</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(event) => {
                      setProfileStatus('')
                      setDeleteConfirmText(event.target.value)
                    }}
                    placeholder="Type DELETE"
                    className="w-full max-w-xs rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleDeleteProfile}
                    disabled={isDeletingProfile || isProfileSaving}
                    className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {isDeletingProfile ? 'Deleting...' : 'Delete Profile'}
                  </button>
                </div>
              </div>

              {profileStatus ? <p className="mt-4 text-sm text-slate-700">{profileStatus}</p> : null}
            </section>
          ) : null}

          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-600">Booking</h2>
              <button
                type="button"
                onClick={() => navigate('/resources')}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Book Now
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
            {taskCards.map((card) => (
              <article key={card.title} className={`${card.color} rounded-2xl p-5 text-white`}>
                <h3 className="text-xl font-extrabold leading-tight">{card.title}</h3>
                <p className="mt-4 text-sm opacity-90">{card.items}</p>
                <div className="mt-3 h-2 rounded-full bg-white/30">
                  <div className={`${card.accent} h-2 rounded-full`} style={{ width: card.progress }}></div>
                </div>
                <p className="mt-2 text-xs font-semibold opacity-90">{card.progress}</p>
              </article>
            ))}
            </div>
          </section>

          <section className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-600">Ticket</h2>
              <button
                type="button"
                onClick={() => navigate('/tickets/new')}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Create Ticket Now
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
            {ticketCards.map((card) => (
              <article key={card.title} className={`${card.color} rounded-2xl p-5 text-white`}>
                <h3 className="text-xl font-extrabold leading-tight">{card.title}</h3>
                <p className="mt-4 text-sm opacity-90">{card.items}</p>
                <div className="mt-3 h-2 rounded-full bg-white/30">
                  <div className={`${card.accent} h-2 rounded-full`} style={{ width: card.progress }}></div>
                </div>
                <p className="mt-2 text-xs font-semibold opacity-90">{card.progress}</p>
              </article>
            ))}
            </div>
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="mb-4 text-2xl font-black text-slate-900">Recent activity</h2>
              <div className="space-y-3">
                {todayTasks.map((task) => (
                  <div key={task.name} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                      <span className={`${task.color} mt-1 h-3 w-3 rounded-full`}></span>
                      <div>
                        <p className="font-bold text-slate-900">{task.name}</p>
                        <p className="text-sm text-slate-500">{task.detail}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">Tracked</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-2xl font-black text-slate-900">Summary</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-3xl font-black text-slate-900">28 h</p>
                  <p className="text-sm text-slate-500">Avg. response time</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-3xl font-black text-slate-900">18</p>
                  <p className="text-sm text-slate-500">Completed requests</p>
                </div>
                <div className="col-span-2 rounded-2xl bg-slate-900 p-4 text-white">
                  <p className="text-sm uppercase tracking-wide text-slate-300">Auditability</p>
                  <p className="mt-2 text-lg font-bold">Every request update is recorded with timestamp and actor.</p>
                </div>
              </div>
            </div>
          </section>

          <footer className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <img src={logo} alt="EduTrack logo" className="h-6 w-6 rounded object-cover" />
                <span className="font-semibold">EduTrack Smart Campus</span>
                <span>Copyright {new Date().getFullYear()}</span>
              </div>
              <div className="flex items-center gap-4 text-slate-500">
                <span className="font-medium">Status: Operational</span>
                <span>Version 1.0</span>
              </div>
            </div>
          </footer>
        </main>

        <aside className="overflow-auto rounded-[1.5rem] border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-black text-slate-900">Calendar</h2>
          <p className="mt-1 text-sm text-slate-500">Today</p>
          <div className="mt-6 space-y-4">
            {calendarItems.map((entry) => (
              <div key={`${entry.time}-${entry.title}`} className="rounded-xl border border-slate-200 p-3">
                <p className="text-lg font-black text-slate-900">{entry.time}</p>
                <p className="text-sm font-semibold text-slate-800">{entry.title}</p>
                <p className="text-xs text-slate-500">{entry.subtitle}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Dashboard
