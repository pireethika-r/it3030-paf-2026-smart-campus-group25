import { useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { addRequesterReply, cancelTicket, deleteAttachment, getTicketAttachmentUrl, getTicketById, updateTicket, uploadAttachments } from '../../api/ticketApi.js'
import TicketStatusBadge from '../../components/tickets/TicketStatusBadge.jsx'

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

const parseDescriptionMetadata = (description) => {
  const lines = String(description || '').split('\n')
  const map = {}

  lines.forEach((line) => {
    const [rawKey, ...rest] = line.split(':')
    if (!rawKey || rest.length === 0) {
      return
    }

    const key = rawKey.trim().toLowerCase()
    const value = rest.join(':').trim()
    if (value) {
      map[key] = value
    }
  })

  return {
    registrationNumber: map['registration number'] || '-',
    facultySchool: map['faculty / school'] || '-',
    requestType: map['request / inquiry type'] || ticketFallbackRequestType,
    department: map.department || '-',
    campusCenter: map['campus / center'] || '-',
    message: map.message || '-',
  }
}

const ticketFallbackRequestType = 'OTHER'

const getOptionValueByLabel = (options, label, fallbackValue) => {
  const matching = options.find((option) => option.label.toLowerCase() === String(label || '').toLowerCase())
  return matching ? matching.value : fallbackValue
}

const createEditFormFromTicket = (ticket) => {
  const metadata = parseDescriptionMetadata(ticket.description)

  const matchedByTitle = requestTypeOptions.find((option) => option.label.toLowerCase() === String(ticket.title || '').toLowerCase())
  const matchedByMetadata = requestTypeOptions.find((option) => option.value.toLowerCase() === String(metadata.requestType || '').toLowerCase())
  const requestType = matchedByTitle?.value || matchedByMetadata?.value || 'OTHER'

  return {
    name: ticket.preferredContactName || '',
    email: ticket.preferredContactEmail || '',
    registrationNumber: metadata.registrationNumber === '-' ? '' : metadata.registrationNumber,
    facultySchool: getOptionValueByLabel(facultyOptions, metadata.facultySchool, facultyOptions[0].value),
    contactNumber: ticket.preferredContactPhone || '',
    requestType,
    department: getOptionValueByLabel(departmentOptions, metadata.department, departmentOptions[0].value),
    subject: requestType === 'OTHER' ? (ticket.title || '') : '',
    campusCenter: getOptionValueByLabel(campusOptions, metadata.campusCenter, campusOptions[0].value),
    message: metadata.message === '-' ? '' : metadata.message,
  }
}

const TicketDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [editError, setEditError] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [editAttachmentFiles, setEditAttachmentFiles] = useState([])
  const [isManagingAttachments, setIsManagingAttachments] = useState(false)
  const [replyMessageDraft, setReplyMessageDraft] = useState('')
  const [replyAttachmentFiles, setReplyAttachmentFiles] = useState([])
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [replyError, setReplyError] = useState('')
  const [isReplyEditing, setIsReplyEditing] = useState(false)

  const loadTicket = async () => {
    try {
      const data = await getTicketById(id)
      setTicket(data)
    } catch (loadError) {
      setError(loadError.message || 'Unable to load ticket.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTicket()
  }, [id])

  useEffect(() => {
    const savedReply = ticket?.requesterReply || ''
    setReplyMessageDraft(savedReply)
    setIsReplyEditing(false)
  }, [ticket])

  const refreshTicket = async () => {
    const data = await getTicketById(id)
    setTicket(data)
  }

  const handleEditChange = (event) => {
    const { name, value } = event.target
    setEditForm((current) => ({ ...current, [name]: value }))
  }

  const handleStartEdit = () => {
    setEditForm(createEditFormFromTicket(ticket))
    setEditError('')
    setEditAttachmentFiles([])
    setIsEditing(true)
  }

  const handleRemoveAttachment = async (attachmentId) => {
    if (!window.confirm('Remove this attachment from the ticket?')) {
      return
    }

    try {
      setIsManagingAttachments(true)
      setEditError('')
      const updatedTicket = await deleteAttachment(attachmentId)
      setTicket(updatedTicket)
      setActionMessage('Attachment removed successfully.')
    } catch (removeError) {
      setEditError(removeError.message || 'Unable to remove attachment.')
    } finally {
      setIsManagingAttachments(false)
    }
  }

  const handleUploadEditAttachments = async () => {
    if (editAttachmentFiles.length === 0) {
      setEditError('Select at least one file to upload.')
      return
    }

    try {
      setIsManagingAttachments(true)
      setEditError('')
      await uploadAttachments(id, editAttachmentFiles)
      const refreshed = await getTicketById(id)
      setTicket(refreshed)
      setEditAttachmentFiles([])
      setActionMessage('Attachment(s) uploaded successfully.')
    } catch (uploadError) {
      setEditError(uploadError.message || 'Unable to upload attachments.')
    } finally {
      setIsManagingAttachments(false)
    }
  }

  const handleSendRequesterReply = async () => {
    if (!replyMessageDraft.trim()) {
      setReplyError('Reply message is required.')
      return
    }

    try {
      setIsSendingReply(true)
      setReplyError('')

      await addRequesterReply(id, replyMessageDraft.trim())

      if (replyAttachmentFiles.length > 0) {
        await uploadAttachments(id, replyAttachmentFiles)
      }

      const refreshed = await getTicketById(id)
      setTicket(refreshed)
      setReplyAttachmentFiles([])
      setIsReplyEditing(false)
      setActionMessage('Reply sent successfully.')
    } catch (sendError) {
      setReplyError(sendError.message || 'Unable to send reply.')
    } finally {
      setIsSendingReply(false)
    }
  }

  const handleEditReply = () => {
    setReplyMessageDraft(ticket?.requesterReply || '')
    setIsReplyEditing(true)
    setReplyError('')
  }

  const handleCancelReplyEdit = () => {
    setReplyMessageDraft(ticket?.requesterReply || '')
    setReplyAttachmentFiles([])
    setReplyError('')
    setIsReplyEditing(false)
    setActionMessage('Changes discarded.')
  }

  const validateEditForm = () => {
    if (!editForm?.name?.trim()) return 'Name is required.'
    if (!editForm?.email?.trim()) return 'Email is required.'
    if (!editForm?.registrationNumber?.trim()) return 'Registration number is required.'
    if (!editForm?.contactNumber?.trim()) return 'Contact number is required.'
    if (!editForm?.department?.trim()) return 'Department is required.'
    if (!editForm?.campusCenter?.trim()) return 'Campus / Center is required.'
    if (!editForm?.message?.trim()) return 'Message is required.'
    if (editForm?.requestType === 'OTHER' && !editForm?.subject?.trim()) {
      return 'Subject is required when request type is Other.'
    }
    return ''
  }

  const handleSaveEdit = async () => {
    const validationMessage = validateEditForm()
    if (validationMessage) {
      setEditError(validationMessage)
      return
    }

    try {
      setIsSavingEdit(true)
      setEditError('')

      const description = [
        `Registration Number: ${editForm.registrationNumber.trim()}`,
        `Faculty / School: ${facultyOptions.find((item) => item.value === editForm.facultySchool)?.label || editForm.facultySchool}`,
        `Request / Inquiry Type: ${editForm.requestType}`,
        `Department: ${departmentOptions.find((item) => item.value === editForm.department)?.label || editForm.department}`,
        `Campus / Center: ${campusOptions.find((item) => item.value === editForm.campusCenter)?.label || editForm.campusCenter}`,
        `Message: ${editForm.message.trim()}`,
      ].join('\n')

      const payload = {
        resourceId: null,
        location: campusOptions.find((item) => item.value === editForm.campusCenter)?.label || editForm.campusCenter,
        category: 'OTHER',
        title: editForm.requestType === 'OTHER'
          ? editForm.subject.trim()
          : (requestTypeOptions.find((item) => item.value === editForm.requestType)?.label || editForm.requestType),
        description,
        preferredContactName: editForm.name.trim(),
        preferredContactEmail: editForm.email.trim().toLowerCase(),
        preferredContactPhone: editForm.contactNumber.trim(),
      }

      const updatedTicket = await updateTicket(id, payload)
      setTicket(updatedTicket)
      setIsEditing(false)
      setActionMessage('Ticket updated successfully.')
    } catch (saveError) {
      setEditError(saveError.message || 'Unable to update ticket.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleCancelTicket = async () => {
    if (!window.confirm('Cancel this ticket? This action cannot be undone.')) {
      return
    }

    try {
      setIsCancelling(true)
      setEditError('')
      const updatedTicket = await cancelTicket(id)
      setTicket(updatedTicket)
      setIsEditing(false)
      setActionMessage('Ticket cancelled successfully.')
    } catch (cancelError) {
      setEditError(cancelError.message || 'Unable to cancel ticket.')
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return <div className="min-h-screen bg-[#f5efe8] p-8 text-center">Loading ticket...</div>
  }

  if (error) {
    return <div className="min-h-screen bg-[#f5efe8] p-8 text-center text-rose-600">{error}</div>
  }

  if (!ticket) {
    return null
  }

  const metadata = parseDescriptionMetadata(ticket.description)
  const requestTypeLabel = ticket.title || metadata.requestType || ticketFallbackRequestType
  const isTicketFinal = ticket.status === 'CLOSED' || ticket.status === 'REJECTED'
  const canEditOrCancel = ticket.editableByCurrentUser && !isTicketFinal
  const hasAdminFollowUp = Boolean(ticket.adminMessage || ticket.requestedDocuments)
  const isAwaitingReply = ticket.status === 'AWAITING_FOR_REPLY'

  // pdf generation adapted from functionality 
  const handlePrintTicket = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 12
    const contentWidth = pageWidth - margin * 2
    let y = 16

    const ensureSpace = (heightNeeded) => {
      if (y + heightNeeded <= pageHeight - margin) {
        return
      }
      doc.addPage()
      y = margin
    }

    const drawCard = (title, rows, options = {}) => {
      const titleSize = 12
      const textSize = 10
      const rowGap = 5.5
      const topPad = 8
      const sidePad = 8
      const bottomPad = 7
      const boxWidth = contentWidth
      const labelWidth = 52

      doc.setFontSize(textSize)
      const wrappedRows = rows.map((row) => {
        const valueLines = doc.splitTextToSize(String(row.value || '-'), boxWidth - sidePad * 2 - labelWidth)
        return {
          label: row.label,
          valueLines,
          height: Math.max(1, valueLines.length) * rowGap,
        }
      })

      const bodyHeight = wrappedRows.reduce((acc, row) => acc + row.height, 0)
      const cardHeight = topPad + 7 + bodyHeight + bottomPad
      ensureSpace(cardHeight + 6)

      if (options.fillColor) {
        doc.setFillColor(...options.fillColor)
        doc.roundedRect(margin, y, boxWidth, cardHeight, 4, 4, 'F')
      } else {
        doc.setFillColor(255, 255, 255)
        doc.setDrawColor(226, 232, 240)
        doc.roundedRect(margin, y, boxWidth, cardHeight, 4, 4, 'FD')
      }

      doc.setTextColor(...(options.titleColor || [15, 23, 42]))
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(titleSize)
      doc.text(title, margin + sidePad, y + topPad)

      let rowY = y + topPad + 7
      doc.setFontSize(textSize)
      wrappedRows.forEach((row) => {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...(options.labelColor || [71, 85, 105]))
        doc.text(`${row.label}:`, margin + sidePad, rowY)

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...(options.textColor || [15, 23, 42]))
        doc.text(row.valueLines, margin + sidePad + labelWidth, rowY)
        rowY += row.height
      })

      y += cardHeight + 6
    }

    doc.setFillColor(15, 23, 42)
    doc.roundedRect(margin, y, contentWidth, 34, 5, 5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text(`Service Request ${ticket.id}`, margin + 8, y + 12)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(String(requestTypeLabel || '-'), margin + 8, y + 20)
    doc.text(`Status: ${String(ticket.status || '-')}`, margin + 8, y + 27)
    y += 42

    drawCard('Request Summary', [
      { label: 'Category', value: ticket.category },
      { label: 'Priority', value: ticket.priority },
      { label: 'Created by', value: `${ticket.createdByName || '-'} (${ticket.createdByEmail || '-'})` },
      { label: 'Assigned', value: ticket.assignedTechnicianName || 'Unassigned' },
    ])

    drawCard('Requester Details', [
      { label: 'Name', value: ticket.preferredContactName },
      { label: 'Email', value: ticket.preferredContactEmail },
      { label: 'Phone', value: ticket.preferredContactPhone || '-' },
      { label: 'Registration', value: metadata.registrationNumber },
      { label: 'Faculty / School', value: metadata.facultySchool },
      { label: 'Department', value: metadata.department },
      { label: 'Campus / Center', value: metadata.campusCenter !== '-' ? metadata.campusCenter : ticket.location },
    ])

    drawCard('Request Message', [
      { label: 'Message', value: metadata.message },
    ])

    drawCard('Resolution Notes (Admin)', [
      { label: 'Notes', value: ticket.resolutionNotes || 'No resolution notes yet.' },
    ], {
      fillColor: [255, 251, 235],
      titleColor: [146, 64, 14],
      labelColor: [180, 83, 9],
      textColor: [120, 53, 15],
    })

    drawCard('Reply to Admin', [
      { label: 'Reply', value: ticket.requesterReply || 'No reply sent yet.' },
    ], {
      fillColor: [236, 254, 255],
      titleColor: [8, 145, 178],
      labelColor: [14, 116, 144],
      textColor: [15, 23, 42],
    })

    drawCard('Additional Information', [
      { label: 'Admin follow-up', value: ticket.adminMessage || '-' },
      { label: 'Requested docs', value: ticket.requestedDocuments || '-' },
      { label: 'Rejection reason', value: ticket.rejectionReason || '-' },
      {
        label: 'Attachments',
        value: ticket.attachments?.length
          ? ticket.attachments.map((item) => item.originalFileName).join(', ')
          : 'None',
      },
    ])

    doc.setTextColor(100, 116, 139)
    doc.setFontSize(9)
    doc.text(`Generated on ${new Date().toLocaleString()}`, margin, pageHeight - 8)
// pdf file save as pdf
    const safeName = `ticket-${ticket.id}.pdf`
    doc.save(safeName)
  }

  return (
    <div className="min-h-screen bg-[#f5efe8] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <nav className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-300/40">
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
          <p className="text-sm font-semibold text-slate-600">Request Details</p>
        </nav>

        <Link to="/tickets/my" className="inline-flex text-sm font-semibold text-[#1f4968] hover:underline">Back to my tickets</Link>

        <div className="rounded-4xl bg-[#0b1739] p-6 text-white shadow-2xl shadow-slate-300/20">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <TicketStatusBadge status={ticket.status} />
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-300">Service Request</p>
              <h1 className="mt-1 text-3xl font-black">Request {ticket.id}</h1>
              <p className="mt-2 text-slate-300">{requestTypeLabel}</p>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-slate-200">
                <div>{metadata.campusCenter !== '-' ? metadata.campusCenter : (ticket.location || 'No campus/center provided')}</div>
                <div>{metadata.department !== '-' ? metadata.department : 'No department provided'}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handlePrintTicket}                                                                                                                                   //pdf generation button
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                >
                  Print
                </button>
                {canEditOrCancel ? (
                  <>
                  <button
                    type="button"
                    onClick={handleStartEdit}
                      className="rounded-xl border border-[#b7d8ea] bg-[#eaf5fc] px-4 py-2 text-sm font-semibold text-[#1f4968] transition hover:bg-[#dceef9]"
                  >
                    Edit Ticket
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelTicket}
                    disabled={isCancelling}
                    className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCancelling ? 'Cancelling...' : 'Cancel Ticket'}
                  </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {actionMessage ? (
          <div className="rounded-2xl border border-[#b7d8ea] bg-[#eaf5fc] px-4 py-3 text-sm font-medium text-[#1f4968]">
            {actionMessage}
          </div>
        ) : null}

        {isEditing && editForm ? (
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-300/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-950">Edit Ticket</h2>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setEditError('')
                }}
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Name
                <input name="name" value={editForm.name} onChange={handleEditChange} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Email
                <input name="email" value={editForm.email} readOnly className="mt-2 w-full cursor-not-allowed rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-600" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Registration number
                <input name="registrationNumber" value={editForm.registrationNumber} onChange={handleEditChange} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Contact number
                <input name="contactNumber" value={editForm.contactNumber} onChange={handleEditChange} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Faculty / School
                <select name="facultySchool" value={editForm.facultySchool} onChange={handleEditChange} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                  {facultyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">Request / Inquiry type
                <select name="requestType" value={editForm.requestType} onChange={handleEditChange} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                  {requestTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">Department
                <select name="department" value={editForm.department} onChange={handleEditChange} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                  {departmentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">Campus / Center
                <select name="campusCenter" value={editForm.campusCenter} onChange={handleEditChange} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                  {campusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>

            {editForm.requestType === 'OTHER' ? (
              <label className="mt-4 block text-sm font-semibold text-slate-700">Subject
                <input name="subject" value={editForm.subject} onChange={handleEditChange} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              </label>
            ) : null}

            <label className="mt-4 block text-sm font-semibold text-slate-700">Message
              <textarea name="message" value={editForm.message} onChange={handleEditChange} rows="4" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
            </label>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Attachments</h3>

              {ticket.attachments?.length ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {ticket.attachments.map((attachment) => (
                    <div key={attachment.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <a href={getTicketAttachmentUrl(attachment.id)} target="_blank" rel="noreferrer" className="block">
                        {attachment.contentType?.startsWith('image/') ? (
                          <img src={getTicketAttachmentUrl(attachment.id)} alt={attachment.originalFileName} className="h-36 w-full object-cover" />
                        ) : (
                          <div className="flex h-36 items-center justify-center bg-slate-100 text-sm font-semibold text-slate-700">PDF Document</div>
                        )}
                      </a>
                      <div className="flex items-center justify-between gap-2 p-3 text-xs">
                        <span className="truncate text-slate-600">{attachment.originalFileName}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(attachment.id)}
                          disabled={isManagingAttachments}
                          className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1 font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No attachments uploaded.</p>
              )}

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={(event) => setEditAttachmentFiles(Array.from(event.target.files || []).slice(0, 3))}
                  className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                />
                <button
                  type="button"
                  onClick={handleUploadEditAttachments}
                  disabled={isManagingAttachments}
                  className="rounded-2xl bg-[#0b1739] px-5 py-3 text-sm font-bold text-white hover:bg-[#14224a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isManagingAttachments ? 'Please wait...' : 'Add attachment'}
                </button>
              </div>
              {editAttachmentFiles.length > 0 ? (
                <p className="mt-2 text-xs text-slate-500">Selected: {editAttachmentFiles.map((file) => file.name).join(', ')}</p>
              ) : null}
            </div>

            {editError ? <p className="mt-3 text-sm text-rose-600">{editError}</p> : null}

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setEditError('')
                }}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingEdit ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-300/40">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Message</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{metadata.message}</p>
            </div>

            <div>
              {(ticket.status === 'RESOLVED' || ticket.status === 'AWAITING_FOR_REPLY') && hasAdminFollowUp ? (
                <div className="mt-4 rounded-2xl border border-[#b7d8ea] bg-[#eaf5fc] p-4">
                  <h3 className="text-sm font-bold text-[#1f4968]">Admin follow-up request</h3>
                  {ticket.adminMessage ? (
                    <p className="mt-2 whitespace-pre-line text-sm text-[#153753]">Message: {ticket.adminMessage}</p>
                  ) : null}
                  {ticket.requestedDocuments ? (
                    <p className="mt-2 whitespace-pre-line text-sm text-[#153753]">Requested documents: {ticket.requestedDocuments}</p>
                  ) : null}
                </div>
              ) : null}

            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-950">Attachments</h2>
              {ticket.attachments?.length ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {ticket.attachments.map((attachment) => (
                    <a key={attachment.id} href={getTicketAttachmentUrl(attachment.id)} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      {attachment.contentType?.startsWith('image/') ? (
                        <img src={getTicketAttachmentUrl(attachment.id)} alt={attachment.originalFileName} className="h-48 w-full object-cover" />
                      ) : (
                        <div className="flex h-48 items-center justify-center bg-slate-100 text-sm font-semibold text-slate-700">PDF Document</div>
                      )}
                      <div className="p-3 text-xs text-slate-600">{attachment.originalFileName}</div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No attachments uploaded.</p>
              )}
            </div>
          </section>

          <aside className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-300/40">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Request details</h2>
              <dl className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="flex justify-between gap-3"><dt>Name</dt><dd className="font-semibold">{ticket.preferredContactName}</dd></div>
                <div className="flex justify-between gap-3"><dt>Email</dt><dd className="font-semibold">{ticket.preferredContactEmail}</dd></div>
                <div className="flex justify-between gap-3"><dt>Registration number</dt><dd className="font-semibold">{metadata.registrationNumber}</dd></div>
                <div className="flex justify-between gap-3"><dt>Faculty / School</dt><dd className="font-semibold">{metadata.facultySchool}</dd></div>
                <div className="flex justify-between gap-3"><dt>Contact number</dt><dd className="font-semibold">{ticket.preferredContactPhone || '-'}</dd></div>
                <div className="flex justify-between gap-3"><dt>Request / Inquiry type</dt><dd className="font-semibold">{metadata.requestType}</dd></div>
                <div className="flex justify-between gap-3"><dt>Department</dt><dd className="font-semibold">{metadata.department}</dd></div>
                <div className="flex justify-between gap-3"><dt>Subject</dt><dd className="font-semibold">{ticket.title || '-'}</dd></div>
                <div className="flex justify-between gap-3"><dt>Campus / Center</dt><dd className="font-semibold">{metadata.campusCenter !== '-' ? metadata.campusCenter : (ticket.location || '-')}</dd></div>
                <div className="flex justify-between gap-3"><dt>Assigned</dt><dd className="font-semibold">{ticket.assignedTechnicianName || 'Unassigned'}</dd></div>
                <div className="flex justify-between gap-3"><dt>Created by</dt><dd className="font-semibold">{ticket.createdByName}</dd></div>
              </dl>
            </div>
          </aside>
        </div>

        <section className="rounded-[1.75rem] border border-[#b7d8ea] bg-[#eaf5fc] p-6 shadow-sm shadow-slate-300/30">
          <h2 className="text-lg font-black text-[#1f4968]">Resolution Notes</h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#2b6187]">Sent by admin</p>

          <div className="mt-3 rounded-2xl border border-amber-200 bg-white p-4 text-slate-800">
            <p className="whitespace-pre-line text-sm">{ticket.resolutionNotes || 'No resolution notes yet.'}</p>
          </div>
        </section>

        {isAwaitingReply ? (
          <section className="rounded-[1.75rem] border border-[#b7d8ea] bg-[#eaf5fc] p-6 shadow-sm shadow-slate-300/30">
            <h2 className="text-lg font-black text-[#1f4968]">Reply to Admin</h2>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#2b6187]">Your response</p>
            <p className="mt-2 text-sm text-[#153753]">Write your reply and attach any requested documents before sending.</p>

            {isReplyEditing ? (
              <>
                <label className="mt-4 block text-sm font-semibold text-slate-700">
                  Reply message
                  <textarea
                    value={replyMessageDraft}
                    onChange={(event) => setReplyMessageDraft(event.target.value)}
                    rows="4"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
                    placeholder="Type your response to the admin here."
                  />
                </label>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <h4 className="text-sm font-bold text-slate-900">Attach documents</h4>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    onChange={(event) => setReplyAttachmentFiles(Array.from(event.target.files || []).slice(0, 3))}
                    className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  />
                  {replyAttachmentFiles.length > 0 ? (
                    <p className="mt-2 text-xs text-slate-500">Selected: {replyAttachmentFiles.map((file) => file.name).join(', ')}</p>
                  ) : null}
                </div>

                {replyError ? <p className="mt-3 text-sm text-rose-600">{replyError}</p> : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSendRequesterReply}
                    disabled={isSendingReply}
                    className="rounded-2xl bg-[#0b1739] px-5 py-3 text-sm font-bold text-white hover:bg-[#14224a] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSendingReply ? 'Sending...' : 'Send reply'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelReplyEdit}
                    className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="whitespace-pre-line text-sm text-slate-800">{ticket.requesterReply || 'No reply sent yet.'}</p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleEditReply}
                    className="rounded-2xl border border-[#b7d8ea] bg-white px-5 py-3 text-sm font-bold text-[#1f4968]"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </div>
  )
}

export default TicketDetailsPage