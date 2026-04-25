import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTicket, uploadAttachments } from '../../api/ticketApi.js'
import { getAuthUser } from '../../auth/roles.js'

const initialForm = {
  name: '',
  email: '',
  registrationNumber: '',
  facultySchool: 'FACULTY_OF_COMPUTING',
  contactNumber: '',
  requestType: 'OTHER',
  department: 'STUDENT_SERVICE',
  subject: '',
  campusCenter: 'MALABE_CENTER',
  message: '',
}

const requestTypeOptions = [
  { value: 'OTHER', label: 'Other' },
  { value: 'GENERAL_INQUIRY', label: 'General Inquiry' },
  { value: 'SERVICE_REQUEST', label: 'Service Request' },
  { value: 'COMPLAINT', label: 'Complaint' },
  { value: 'FEEDBACK', label: 'Feedback' },
]

const facultyOptions = [
  { value: 'FACULTY_OF_COMPUTING', label: 'Faculty of Computing' },
  { value: 'FACULTY_OF_ENGINEERING', label: 'Faculty of Engineering' },
  { value: 'SCHOOL_OF_BUSINESS', label: 'School of Business' },
  { value: 'FACULTY_OF_HUMANITIES_SCIENCE', label: 'Faculty of Humanities & Science' },
  { value: 'SCHOOL_OF_ARCHITECTURE', label: 'School of Architecture' },
]

const departmentOptions = [
  { value: 'STUDENT_SERVICE', label: 'Student Service' },
  { value: 'ALUMNI_USER', label: 'Alumni User' },
  { value: 'ALUMNI_SERVICE_REQUEST_FORM', label: 'Alumni Service Request Form' },
]

const campusOptions = [
  { value: 'MALABE_CENTER', label: 'Malabe Center' },
  { value: 'KANDY_CENTER', label: 'Kandy Center' },
  { value: 'NOTHERN_CENTER', label: 'Nothern Center' },
  { value: 'MATARA_CENTER', label: 'Matara Center' },
]

const CreateTicketPage = () => {
  const navigate = useNavigate()
  const user = getAuthUser()
  // Pre-fill the form with the logged-in user's basic details when available.
  const [form, setForm] = useState(() => ({
    ...initialForm,
    name: user?.fullName || '',
    email: user?.email || '',
  }))
  const [files, setFiles] = useState([])
  const [fieldError, setFieldError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileSummary = useMemo(() => files.map((file) => file.name).join(', '), [files])
  const isOtherRequestType = form.requestType === 'OTHER'

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []).slice(0, 3)
    setFiles(selectedFiles)
  }

  const validate = () => {
    // Keep client-side checks simple before sending the ticket to the backend.
    if (!form.name.trim()) {
      return 'Name is required.'
    }
    if (!form.email.trim()) {
      return 'Email is required.'
    }
    if (!form.registrationNumber.trim()) {
      return 'Registration number is required.'
    }
    if (!form.facultySchool.trim()) {
      return 'Faculty / School is required.'
    }
    if (!form.contactNumber.trim()) {
      return 'Contact number is required.'
    }
    if (!form.department.trim()) {
      return 'Department is required.'
    }
    if (isOtherRequestType && !form.subject.trim()) {
      return 'Subject is required when request type is Other.'
    }
    if (!form.campusCenter.trim()) {
      return 'Campus / Center is required.'
    }
    if (!form.message.trim()) {
      return 'Message is required.'
    }
    if (files.length > 3) {
      return 'You can upload up to 3 images.'
    }
    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFieldError('')
    setSubmitError('')
    setSuccessMessage('')

    const validationMessage = validate()
    if (validationMessage) {
      setFieldError(validationMessage)
      return
    }

    setIsSubmitting(true)
    try {
      // Convert the form fields into the ticket payload expected by the API.
      const normalizedMessage = form.message.trim()
      const description = [
        `Registration Number: ${form.registrationNumber.trim()}`,
        `Faculty / School: ${facultyOptions.find((item) => item.value === form.facultySchool)?.label || form.facultySchool}`,
        `Request / Inquiry Type: ${form.requestType}`,
        `Department: ${departmentOptions.find((item) => item.value === form.department)?.label || form.department}`,
        `Campus / Center: ${campusOptions.find((item) => item.value === form.campusCenter)?.label || form.campusCenter}`,
        normalizedMessage ? `Message: ${normalizedMessage}` : null,
      ]
        .filter(Boolean)
        .join('\n')

      const payload = {
        resourceId: null,
        location: campusOptions.find((item) => item.value === form.campusCenter)?.label || form.campusCenter,
        category: 'OTHER',
        title: isOtherRequestType
          ? form.subject.trim()
          : (requestTypeOptions.find((item) => item.value === form.requestType)?.label || form.requestType),
        description,
        preferredContactName: form.name.trim(),
        preferredContactEmail: form.email.trim().toLowerCase(),
        preferredContactPhone: form.contactNumber.trim(),
      }

      const createdTicket = await createTicket(payload)
      if (files.length > 0) {
        await uploadAttachments(createdTicket.id, files)
      }
      setSuccessMessage('Ticket created successfully.')
      navigate(`/tickets/${createdTicket.id}`, { replace: true })
    } catch (error) {
      setSubmitError(error.message || 'Unable to create ticket.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5efe8] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-300/40">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate('/tickets/my')}
              className="rounded-2xl border border-[#c8dff1] bg-[#eaf5fc] px-4 py-2 text-sm font-semibold text-[#1f4968] transition hover:bg-[#dceef9]"
            >
              My Tickets
            </button>
            <button
              type="button"
              onClick={() => navigate('/tickets/new')}
              className="rounded-2xl border border-[#0b1739] bg-[#0b1739] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#14224a]"
            >
              New Request
            </button>
          </div>
          <p className="text-sm font-semibold text-slate-600">Request Form</p>
        </nav>

        <header className="mb-6 rounded-4xl border border-[#c3d6e8] bg-linear-to-r from-[#0b1739] to-[#17366c] p-8 shadow-lg shadow-slate-300/40">
          <p className="text-xs uppercase tracking-[0.34em] text-[#9dc9e4]">Service Desk</p>
          <h1 className="mt-3 text-3xl font-black text-white sm:text-5xl">Submit Request / Inquiry</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#d2dcee]">
            Share your request details so the support team can route and respond quickly.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-4xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          <section className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Personal Details</h2>
              <div className="mt-4 space-y-4">
                <label className="block text-sm font-semibold text-slate-700">
                  Name
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Email
                  <input
                    name="email"
                    value={form.email}
                    placeholder="you@example.com"
                      readOnly
                      className="mt-2 w-full cursor-not-allowed rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-600 outline-none placeholder:text-slate-400"
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Registration number
                  <input
                    name="registrationNumber"
                    value={form.registrationNumber}
                    onChange={handleChange}
                    placeholder="e.g. IT2026XXXX"
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Contact number
                  <input
                    name="contactNumber"
                    value={form.contactNumber}
                    onChange={handleChange}
                    placeholder="e.g. 07XXXXXXXX"
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Request Details</h2>
                <div className="mt-4 space-y-4">
                  <label className="block text-sm font-semibold text-slate-700">
                    Faculty / School
                    <select
                      name="facultySchool"
                      value={form.facultySchool}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
                    >
                      {facultyOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm font-semibold text-slate-700">
                    Request / Inquiry type
                    <select
                      name="requestType"
                      value={form.requestType}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
                    >
                      {requestTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm font-semibold text-slate-700">
                    Department
                    <select
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
                    >
                      {departmentOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>

                  {isOtherRequestType ? (
                    <label className="block text-sm font-semibold text-slate-700">
                      Subject
                      <input
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        placeholder="Short summary of your request"
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
                      />
                    </label>
                  ) : null}

                  <label className="block text-sm font-semibold text-slate-700">
                    Campus / Center
                    <select
                      name="campusCenter"
                      value={form.campusCenter}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
                    >
                      {campusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm font-semibold text-slate-700">
                    Message
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows="5"
                      placeholder="Provide additional context."
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Evidence (optional)</h2>
                <label className="mt-4 block text-sm font-semibold text-slate-700">
                  Attach images (optional)
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    onChange={handleFileChange}
                    className="mt-2 w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-[#0b1739] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                  />
                </label>
                {fileSummary ? <p className="mt-2 text-xs text-slate-500">Selected: {fileSummary}</p> : null}
              </div>
            </div>
          </section>

          {fieldError ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{fieldError}</div> : null}
          {submitError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</div> : null}
          {successMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div> : null}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-2xl bg-[#0b1739] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#14224a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Submitting...' : 'Create ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateTicketPage
