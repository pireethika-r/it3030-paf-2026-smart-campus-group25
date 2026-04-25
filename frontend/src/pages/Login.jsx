import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import logo from '../assets/edutrack.png'
import { getDashboardPath, normalizeRole } from '../auth/roles.js'
import { API_BASE_URL } from '../config.js'

const Login = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitMessage('')

    const normalizedEmail = formData.email.trim().toLowerCase()
    const password = formData.password
    const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

    if (!normalizedEmail || !emailPattern.test(normalizedEmail)) {
      setSubmitMessage('Please enter a valid email address.')
      return
    }

    if (!password.trim()) {
      setSubmitMessage('Password is required.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        const validationErrors = data?.errors
        const validationMessage = validationErrors
          ? Object.values(validationErrors).find((value) => typeof value === 'string' && value.trim())
          : null

        setSubmitMessage(validationMessage || data.message || 'Login failed. Please check your credentials.')
        return
      }

      const fallbackItNumber = localStorage.getItem('auth_it_number')
      const resolvedItNumber = data.itNumber || data.itNo || fallbackItNumber || 'IT Number'
      const normalizedRole = normalizeRole(data.role)

      localStorage.setItem('auth_user', JSON.stringify({
        email: data.email,
        itNumber: resolvedItNumber,
        itNo: resolvedItNumber,
        fullName: data.fullName,
        role: normalizedRole,
      }))

      if (resolvedItNumber && resolvedItNumber !== 'IT Number') {
        localStorage.setItem('auth_it_number', resolvedItNumber)
      }

      const targetPath = getDashboardPath(normalizedRole)
      navigate(targetPath, { replace: true })
    } catch {
      setSubmitMessage('Cannot connect to server. Please start backend and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <header className="border-b border-slate-200 bg-white/85 px-6 py-3 backdrop-blur sm:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="EduTrack logo" className="h-10 w-10 rounded-xl object-cover" />
            <div>
              <h2 className="text-xl font-black text-slate-900">EduTrack</h2>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Smart Campus Platform</p>
            </div>
          </div>
          <div className="text-sm text-slate-600">
            New here?{' '}
            <Link to="/signup" className="font-bold text-indigo-700 hover:underline">
              Create account
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* LEFT SIDE */}
        <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 lg:flex">
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-300/60 blur-3xl"></div>
          <div className="absolute -bottom-24 right-0 h-112 w-md rounded-full bg-purple-300/50 blur-3xl"></div>

          <div className="relative z-10 m-10 flex w-full flex-col justify-between rounded-[2.5rem] border border-white/40 bg-white/45 p-10 backdrop-blur-sm">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">
                Smart Campus Operations
              </p>
              <h2 className="max-w-sm text-4xl font-extrabold leading-tight text-slate-900">
                Book rooms and assets, track incidents, and close maintenance faster.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">
                One platform for requests, approvals, technician updates, and verified resolutions with full audit history.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase text-gray-500">Bookings today</p>
                <p className="mt-2 text-2xl font-extrabold text-indigo-700">426</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase text-gray-500">Open incidents</p>
                <p className="mt-2 text-2xl font-extrabold text-purple-600">38</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex w-full items-center justify-center px-6 py-12 sm:px-12 lg:w-1/2">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-4xl font-extrabold text-slate-900">Welcome Back</h1>
              <p className="mt-2 text-sm text-slate-500">Login to continue to your smart campus account.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  placeholder="name@smartcampus.com"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-indigo-200 transition focus:ring-4"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 ring-indigo-200 transition focus-within:ring-4">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full bg-transparent outline-none"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  />
                  <button type="button" onClick={() => setShowPassword(prev => !prev)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button disabled={isSubmitting} className="water-button w-full rounded-2xl py-3 font-bold text-white shadow-lg transition">
                {isSubmitting ? 'Logging in...' : 'Login'}
              </button>

              {submitMessage && <p className="text-red-500 text-sm">{submitMessage}</p>}
            </form>

            {/* GOOGLE BUTTON */}
            <button
              type="button"
              onClick={() => window.location.href = "http://localhost:8080/oauth2/authorization/google"}
              className="water-button w-full rounded-2xl py-3 font-bold text-white mt-3 shadow-lg transition"
            >
               Login with Google
            </button>

            <div className="mt-8 text-center text-sm text-slate-600">
              New to EduTrack?{' '}
              <Link to="/signup" className="font-bold text-purple-600 hover:underline">
                Create account
              </Link>
            </div>
          </div>
        </div>

      </div>

      <footer className="border-t border-slate-200 bg-white px-6 py-3 sm:px-10">
        <div className="mx-auto flex max-w-7xl justify-between text-xs text-slate-500">
          <p>EduTrack Smart Campus</p>
          <p>Secure access for bookings and maintenance workflows</p>
        </div>
      </footer>
    </div>
  )
}

export default Login

