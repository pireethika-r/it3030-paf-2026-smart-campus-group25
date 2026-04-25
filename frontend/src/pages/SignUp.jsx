import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import logo from '../assets/edutrack.png'
import { requestSignupCode, verifySignupCode } from '../api/authApi.js'

const initialForm = {
  name: '',
  itNumber: '',
  email: '',
  password: '',
  confirmPassword: '',
}

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const itNumberRegex = /^IT\d{8}$/

const SignUp = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitMessage, setSubmitMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verificationStep, setVerificationStep] = useState('details')
  const [verificationCode, setVerificationCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const passwordChecks = {
    minLength: formData.password.length >= 8,
    hasNumberOrSymbol: /[0-9!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    hasLowerAndUpper: /[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password),
  }

  const validateField = (fieldName, value, nextData) => {
    switch (fieldName) {
      case 'name':
        if (!value.trim()) {
          return 'Full name is required.'
        }
        if (value.trim().length < 3) {
          return 'Name must be at least 3 characters.'
        }
        return ''
      case 'itNumber':
        if (!value.trim()) {
          return 'IT number is required.'
        }
        if (!itNumberRegex.test(value.trim().toUpperCase())) {
          return 'Use format IT23608054 (IT + 8 digits).'
        }
        return ''
      case 'email':
        if (!value.trim()) {
          return 'Email is required.'
        }
        if (!emailRegex.test(value.trim())) {
          return 'Use a valid email address.'
        }
        return ''
      case 'password':
        if (!value) {
          return 'Password is required.'
        }
        if (
          !passwordChecks.minLength ||
          !passwordChecks.hasNumberOrSymbol ||
          !passwordChecks.hasLowerAndUpper
        ) {
          return 'Password does not meet the required rules.'
        }
        return ''
      case 'confirmPassword':
        if (!value) {
          return 'Please confirm your password.'
        }
        if (value !== nextData.password) {
          return 'Passwords do not match.'
        }
        return ''
      default:
        return ''
    }
  }

  const validateAll = (nextData) => {
    const nextErrors = {
      name: validateField('name', nextData.name, nextData),
      itNumber: validateField('itNumber', nextData.itNumber, nextData),
      email: validateField('email', nextData.email, nextData),
      password: validateField('password', nextData.password, nextData),
      confirmPassword: validateField('confirmPassword', nextData.confirmPassword, nextData),
    }

    return nextErrors
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    const normalizedValue = name === 'itNumber' ? value.toUpperCase().replace(/\s+/g, '') : value

    const nextData = {
      ...formData,
      [name]: normalizedValue,
    }

    setFormData(nextData)
    setSubmitMessage('')

    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, normalizedValue, nextData),
      }))
    }

    if (name === 'password' && touched.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateField('confirmPassword', nextData.confirmPassword, nextData),
      }))
    }
  }

  const handleBlur = (event) => {
    const { name } = event.target

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }))

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, formData[name], formData),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (verificationStep === 'details') {
      const nextErrors = validateAll(formData)
      setErrors(nextErrors)
      setTouched({
        name: true,
        itNumber: true,
        email: true,
        password: true,
        confirmPassword: true,
      })

      const hasErrors = Object.values(nextErrors).some(Boolean)
      if (hasErrors) {
        setSubmitMessage('Please fix the highlighted fields before submitting.')
        return
      }

      setIsSubmitting(true)
      try {
        const response = await requestSignupCode({
          fullName: formData.name.trim(),
          itNumber: formData.itNumber.trim().toUpperCase(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        })

        setSubmitMessage(response.message || 'A verification code has been sent to your email.')
        setVerificationStep('verify')
      } catch (requestError) {
        setSubmitMessage(requestError.message || 'Cannot connect to server. Please start backend and try again.')
      } finally {
        setIsSubmitting(false)
      }

      return
    }

    if (!verificationCode.trim()) {
      setSubmitMessage('Enter the 4-digit verification code sent to your email.')
      return
    }

    setIsSubmitting(true)
    try {
      const data = await verifySignupCode({
        email: formData.email.trim().toLowerCase(),
        code: verificationCode.trim(),
      })

      localStorage.setItem('auth_it_number', formData.itNumber.trim().toUpperCase())
      setSubmitMessage(data.message || 'Signup successful. Redirecting to login...')
      setTimeout(() => navigate('/login', { replace: true }), 800)
    } catch (submitError) {
      setSubmitMessage(submitError.message || 'Invalid or expired code. Please request a new code and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendCode = async () => {
    const nextErrors = validateAll(formData)
    setErrors(nextErrors)
    setTouched({
      name: true,
      itNumber: true,
      email: true,
      password: true,
      confirmPassword: true,
    })

    const hasErrors = Object.values(nextErrors).some(Boolean)
    if (hasErrors) {
      setSubmitMessage('Fix the form before requesting a new code.')
      setVerificationStep('details')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await requestSignupCode({
        fullName: formData.name.trim(),
        itNumber: formData.itNumber.trim().toUpperCase(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      })

      setVerificationCode('')
      setSubmitMessage(response.message || 'A new verification code has been sent to your email.')
      setVerificationStep('verify')
    } catch (requestError) {
      setSubmitMessage(requestError.message || 'Cannot connect to server. Please start backend and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFieldValid = (fieldName) => touched[fieldName] && !errors[fieldName] && formData[fieldName]

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <header className="border-b border-slate-200 bg-white/90 px-6 py-3 backdrop-blur sm:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="EduTrack logo" className="h-10 w-10 rounded-xl object-cover" />
            <div>
              <h2 className="text-xl font-black text-slate-900">EduTrack</h2>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Smart Campus Platform</p>
            </div>
          </div>
          <div className="text-sm text-slate-600">
            Already member?{' '}
            <Link to="/login" className="font-bold text-blue-900 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
      <div className="relative flex w-full flex-col px-8 py-10 sm:px-16 md:px-24 lg:w-1/2">
        <div className="mb-12 flex w-full items-center justify-between">
          <Link
            to="/login"
            className="rounded-full border border-gray-200 p-2 transition hover:bg-gray-50"
          >
            <svg className="h-4 w-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div className="text-sm font-medium text-gray-600">
            Already member?{' '}
            <Link to="/login" className="font-bold text-blue-900 hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <h1 className="mb-2 text-4xl font-extrabold text-blue-950">Sign Up</h1>
          <p className="mb-10 text-sm text-gray-400">Join the EduTrack Smart Campus Platform</p>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="flex items-center border-b border-gray-300 py-2 transition focus-within:border-blue-900">
              <svg className="mr-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                name="name"
                type="text"
                placeholder="Daniel Ahmadi"
                className="w-full bg-transparent font-medium text-blue-950 outline-none placeholder:text-gray-500"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {isFieldValid('name') ? (
                <svg className="ml-2 h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : null}
            </div>
            {touched.name && errors.name ? <p className="text-xs text-red-500">{errors.name}</p> : null}

            <div className="flex items-center border-b border-gray-300 py-2 transition focus-within:border-blue-900">
              <svg className="mr-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
              </svg>
              <input
                name="itNumber"
                type="text"
                placeholder="IT********"
                className="w-full bg-transparent font-medium uppercase text-blue-950 outline-none placeholder:text-gray-500"
                value={formData.itNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={10}
              />
              {isFieldValid('itNumber') ? (
                <svg className="ml-2 h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : null}
            </div>
            {touched.itNumber && errors.itNumber ? <p className="text-xs text-red-500">{errors.itNumber}</p> : null}

            <div className="flex items-center border-b border-gray-300 py-2 transition focus-within:border-blue-900">
              <svg className="mr-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                name="email"
                type="email"
                placeholder="name@smartcampus.com"
                className="w-full bg-transparent font-medium text-blue-950 outline-none placeholder:text-gray-500"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {isFieldValid('email') ? (
                <svg className="ml-2 h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : null}
            </div>
            {touched.email && errors.email ? <p className="text-xs text-red-500">{errors.email}</p> : null}

            <div className="flex items-center border-b border-orange-400 py-2 transition focus-within:border-orange-500">
              <svg className="mr-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="********"
                className="w-full bg-transparent font-bold tracking-widest text-blue-950 outline-none placeholder:text-gray-400"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="ml-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {touched.password && errors.password ? <p className="text-xs text-red-500">{errors.password}</p> : null}

            <div className="mt-2 space-y-1">
              <div className={`flex items-center text-xs ${passwordChecks.minLength ? 'text-green-500' : 'text-gray-400'}`}>
                <div className={`mr-2 h-1.5 w-1.5 rounded-full ${passwordChecks.minLength ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                Least 8 characters
              </div>
              <div className={`flex items-center text-xs ${passwordChecks.hasNumberOrSymbol ? 'text-green-500' : 'text-gray-400'}`}>
                <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
                Least one number (0-9) or a symbol
              </div>
              <div className={`flex items-center text-xs ${passwordChecks.hasLowerAndUpper ? 'text-green-500' : 'text-gray-400'}`}>
                <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
                Lowercase (a-z) and uppercase (A-Z)
              </div>
            </div>

            <div className="mt-6 flex items-center border-b border-gray-300 py-2 transition focus-within:border-blue-900">
              <svg className="mr-3 h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-Type Password"
                className="w-full bg-transparent font-medium text-blue-950 outline-none placeholder:text-gray-300"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="ml-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword ? (
              <p className="text-xs text-red-500">{errors.confirmPassword}</p>
            ) : null}

            {verificationStep === 'verify' ? (
              <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <p className="text-sm font-semibold text-blue-950">Enter the 4-digit code sent to {formData.email || 'your email'}.</p>
                <div className="flex items-center border-b border-blue-200 py-2 transition focus-within:border-blue-900">
                  <svg className="mr-3 h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <input
                    name="verificationCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="1234"
                    className="w-full bg-transparent font-bold tracking-[0.5em] text-blue-950 outline-none placeholder:text-blue-300"
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 4))}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isSubmitting}
                  className="text-sm font-semibold text-blue-900 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Resend code
                </button>
              </div>
            ) : null}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="water-button flex w-48 items-center justify-between rounded-full px-8 py-3 font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:brightness-110"
              >
                {isSubmitting ? (verificationStep === 'verify' ? 'Verifying...' : 'Signing Up...') : verificationStep === 'verify' ? 'Verify Code' : 'Sign Up'}
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
              {submitMessage ? (
                <p className={`mt-3 text-sm ${submitMessage.toLowerCase().includes('sent to your email') || submitMessage.toLowerCase().includes('successful') ? 'text-green-600' : 'text-red-500'}`}>
                  {submitMessage}
                </p>
              ) : null}
            </div>
          </form>
        </div>
      </div>

      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden rounded-l-[3rem] bg-blue-900 shadow-2xl lg:flex">
        <div className="absolute right-0 top-0 h-full w-full opacity-20">
          <div className="absolute right-[-10%] top-[-10%] h-[60%] w-[120%] rounded-full bg-blue-800 blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-20%] h-[70%] w-full rounded-full bg-orange-600 blur-3xl"></div>
        </div>

        <div className="relative z-10 flex w-full max-w-lg flex-col gap-8 px-8">
          <div className="flex items-end gap-6">
            <div className="w-64 -rotate-2 transform rounded-2xl bg-white p-6 shadow-xl transition duration-300 hover:rotate-0">
              <h3 className="mb-1 text-sm font-bold text-orange-500">Facility Bookings</h3>
              <p className="mb-6 text-3xl font-extrabold text-blue-950">2,184</p>

              <div className="relative flex h-16 w-full items-end">
                <svg className="h-full w-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <path d="M0 30 Q 15 10, 30 25 T 60 20 T 80 10 T 100 25" fill="none" stroke="#f97316" strokeWidth="3" />
                  <path d="M0 35 Q 20 40, 40 20 T 70 30 T 90 20 T 100 35" fill="none" stroke="#1e3a8a" strokeWidth="3" />
                </svg>
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-blue-950 px-2 py-1 text-xs font-bold text-white">
                  +72
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 pb-4">
              <div className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-white shadow-lg transition hover:scale-110">
                <svg className="h-6 w-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-8 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-white shadow-lg transition hover:scale-110">
                <svg className="h-6 w-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-xl">
            <div className="absolute left-6 top-8 space-y-4 opacity-10">
              <div className="h-2 w-16 rounded-full bg-blue-900"></div>
              <div className="h-2 w-24 rounded-full bg-blue-900"></div>
              <div className="h-2 w-20 rounded-full bg-blue-900"></div>
              <div className="h-2 w-12 rounded-full bg-blue-900"></div>
            </div>

            <div className="relative z-10 ml-20">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold text-blue-950">Clear Workflow, Trusted Updates</h3>
              <p className="text-sm leading-relaxed text-gray-400">
                Manage room and asset bookings, report faults quickly, and follow every technician action through a complete audit trail.
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-blue-900">
                Role-based access for students, staff, admins, and technicians
              </p>
            </div>
          </div>
        </div>
      </div>

      </div>

      <footer className="border-t border-slate-200 bg-white px-6 py-3 sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <p>EduTrack Smart Campus</p>
          <p>Role-based access and auditable updates</p>
        </div>
      </footer>
    </div>
  )
}

export default SignUp
