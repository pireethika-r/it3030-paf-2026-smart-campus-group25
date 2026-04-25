import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { requestPasswordResetCode, verifyPasswordReset } from '../api/authApi.js'

const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState('request')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const passwordChecks = {
    minLength: newPassword.length >= 8,
    hasNumberOrSymbol: /[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    hasLowerAndUpper: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
  }

  const resetForm = () => {
    setVerificationCode('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleRequestCode = async (event) => {
    event.preventDefault()

    if (!email.trim()) {
      setError('Email is required.')
      setSuccessMessage('')
      return
    }

    if (!emailRegex.test(email.trim())) {
      setError('Use a valid email address.')
      setSuccessMessage('')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await requestPasswordResetCode({ email: email.trim().toLowerCase() })
      setError('')
      setSuccessMessage(response.message || 'A verification code has been sent to your email.')
      setStep('verify')
    } catch (requestError) {
      setError(requestError.message || 'Unable to send code. Please try again.')
      setSuccessMessage('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendCode = async () => {
    if (!email.trim()) {
      setError('Email is required.')
      setSuccessMessage('')
      setStep('request')
      return
    }

    if (!emailRegex.test(email.trim())) {
      setError('Use a valid email address.')
      setSuccessMessage('')
      setStep('request')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await requestPasswordResetCode({ email: email.trim().toLowerCase() })
      setError('')
      setSuccessMessage(response.message || 'A new verification code has been sent to your email.')
      setStep('verify')
    } catch (requestError) {
      setError(requestError.message || 'Unable to send code. Please try again.')
      setSuccessMessage('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (event) => {
    event.preventDefault()

    if (!verificationCode.trim()) {
      setError('Enter the 4-digit verification code.')
      setSuccessMessage('')
      return
    }

    if (!newPassword) {
      setError('New password is required.')
      setSuccessMessage('')
      return
    }

    if (!passwordChecks.minLength || !passwordChecks.hasNumberOrSymbol || !passwordChecks.hasLowerAndUpper) {
      setError('Password does not meet the required rules.')
      setSuccessMessage('')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      setSuccessMessage('')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await verifyPasswordReset({
        email: email.trim().toLowerCase(),
        code: verificationCode.trim(),
        newPassword,
        confirmPassword,
      })

      setError('')
      setSuccessMessage(response.message || 'Password updated successfully. Redirecting to login...')
      resetForm()
      setTimeout(() => navigate('/login', { replace: true }), 900)
    } catch (resetError) {
      setError(resetError.message || 'Invalid or expired code. Please request a new code.')
      setSuccessMessage('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8">
          <p className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-900">
            Account Recovery
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900">Forgot Password</h1>
          <p className="mt-2 text-sm text-slate-500">
            {step === 'request'
              ? 'Enter your email to receive a 4-digit verification code.'
              : 'Enter the code from your email and choose a new password.'}
          </p>
        </div>

        <form className="space-y-4" onSubmit={step === 'request' ? handleRequestCode : handleResetPassword} noValidate>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="resetEmail">
              Email Address
            </label>
            <input
              id="resetEmail"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
                setSuccessMessage('')
              }}
              placeholder="name@smartcampus.com"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-orange-200 transition focus:ring-4"
              required
            />
          </div>

          {step === 'verify' ? (
            <>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="resetCode">
                  Verification Code
                </label>
                <input
                  id="resetCode"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={verificationCode}
                  onChange={(event) => {
                    setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 4))
                    setError('')
                    setSuccessMessage('')
                  }}
                  placeholder="1234"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-orange-200 transition focus:ring-4"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="newPassword">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value)
                    setError('')
                    setSuccessMessage('')
                  }}
                  placeholder="Enter a new password"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-orange-200 transition focus:ring-4"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value)
                    setError('')
                    setSuccessMessage('')
                  }}
                  placeholder="Repeat the new password"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-orange-200 transition focus:ring-4"
                  required
                />
              </div>

              <div className="space-y-1 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                <p className={passwordChecks.minLength ? 'text-green-600' : ''}>At least 8 characters</p>
                <p className={passwordChecks.hasNumberOrSymbol ? 'text-green-600' : ''}>At least one number or symbol</p>
                <p className={passwordChecks.hasLowerAndUpper ? 'text-green-600' : ''}>Lowercase and uppercase letters</p>
              </div>
            </>
          ) : null}

          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          {successMessage ? <p className="text-sm text-green-600">{successMessage}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="water-button w-full rounded-2xl py-3 font-bold text-white shadow-lg shadow-blue-900/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (step === 'request' ? 'Sending Code...' : 'Resetting Password...') : step === 'request' ? 'Send Code' : 'Reset Password'}
          </button>

          {step === 'verify' ? (
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-slate-200 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Resend Code
            </button>
          ) : null}
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Remembered your password?{' '}
          <Link to="/login" className="font-bold text-blue-900 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
