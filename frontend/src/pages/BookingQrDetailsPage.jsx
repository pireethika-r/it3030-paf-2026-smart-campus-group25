import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getBookingByQrToken } from '../api/bookingApi.js'
import logoUrl from '../assets/edutrack.png'
import { buildQrScanUrl } from '../utils/publicAppUrl.js'

const cardLabel = 'text-xs font-semibold uppercase tracking-wide text-slate-500'
const cardValue = 'mt-1 text-sm font-semibold text-slate-900'

const BookingQrDetailsPage = () => {
  const { token } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const statusColor = useMemo(() => {
    const status = booking?.status || 'PENDING'
    if (status === 'APPROVED') return 'bg-emerald-100 text-emerald-800'
    if (status === 'REJECTED') return 'bg-rose-100 text-rose-800'
    if (status === 'CANCELLED') return 'bg-slate-200 text-slate-700'
    return 'bg-amber-100 text-amber-800'
  }, [booking])

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setError('Missing QR token.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getBookingByQrToken(token)
        setBooking(data)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [token])

  const escapeHtml = (value) => {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
  }

  const onDownloadPdf = async () => {
    if (!booking) {
      return
    }

    try {
      const scanUrl = buildQrScanUrl(booking.qrToken || token || '')
      const qrPreviewUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(scanUrl)}`

      const safe = {
        id: escapeHtml(booking.id),
        requesterName: escapeHtml(booking.requesterName),
        requesterEmail: escapeHtml(booking.requesterEmail),
        requesterItNumber: escapeHtml(booking.requesterItNumber),
        resourceType: escapeHtml(booking.resourceType),
        resourceName: escapeHtml(booking.resourceName),
        bookingDate: escapeHtml(booking.bookingDate),
        startTime: escapeHtml(booking.startTime),
        endTime: escapeHtml(booking.endTime),
        purpose: escapeHtml(booking.purpose || 'N/A'),
        status: escapeHtml(booking.status),
        checkedIn: booking.checkedIn ? 'Yes' : 'No',
        checkedInAt: escapeHtml(booking.checkedInAt || 'Not yet'),
      }

      const printWindow = window.open('', '_blank', 'width=900,height=700')
      if (!printWindow) {
        throw new Error('Popup blocked by browser')
      }

      const html = `
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Booking ${safe.id} Details</title>
            <style>
              :root {
                --navy: #1e3a8a;
                --blue: #2563eb;
                --orange: #f59e0b;
                --slate: #0f172a;
                --line: #dbe3ef;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              @page {
                size: A4;
                margin: 12mm;
              }
              body {
                font-family: "Segoe UI", Arial, sans-serif;
                margin: 0;
                color: var(--slate);
                background: #f1f5f9;
              }
              .sheet {
                max-width: 820px;
                margin: 12px auto;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                overflow: hidden;
              }
              .header {
                background: linear-gradient(115deg, var(--navy) 0%, var(--blue) 56%, var(--orange) 100%);
                color: #fff;
                padding: 18px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 14px;
              }
              .brand {
                display: flex;
                align-items: center;
                gap: 12px;
              }
              .logo {
                width: 64px;
                height: 64px;
                object-fit: contain;
                background: rgba(255,255,255,0.9);
                border-radius: 10px;
                padding: 4px;
              }
              .title h1 {
                margin: 0;
                font-size: 22px;
                letter-spacing: 0.2px;
              }
              .title p {
                margin: 5px 0 0;
                font-size: 12px;
                opacity: 0.95;
              }
              .status-pill {
                background: rgba(255, 255, 255, 0.95);
                color: #1f2937;
                border-radius: 999px;
                padding: 8px 12px;
                font-size: 11px;
                font-weight: 800;
              }
              .content {
                padding: 16px;
              }
              .grid {
                display: grid;
                grid-template-columns: 1.4fr 1fr;
                gap: 12px;
              }
              .card {
                border-radius: 12px;
                border: 1px solid var(--line);
                padding: 12px;
              }
              .student { background: #e0f2fe; border-color: #93c5fd; }
              .booking { background: #fef3c7; border-color: #facc15; }
              .qrbox { background: #ecfeff; border-color: #67e8f9; text-align: center; }
              .purpose { margin-top: 12px; background: #eef2ff; border-color: #c7d2fe; }
              .status { margin-top: 12px; background: #dcfce7; border-color: #86efac; }
              .label {
                font-size: 11px;
                color: #334155;
                margin-top: 8px;
                font-weight: 800;
                text-transform: uppercase;
              }
              .value {
                font-size: 14px;
                color: #0f172a;
                margin-top: 2px;
                font-weight: 700;
                word-break: break-word;
              }
              .qr-img {
                width: 122px;
                height: 122px;
                border-radius: 10px;
                border: 1px solid #bae6fd;
                background: #fff;
                padding: 6px;
              }
              .hint {
                margin-top: 7px;
                font-size: 11px;
                color: #0c4a6e;
              }
              .footer {
                margin-top: 12px;
                padding-top: 10px;
                border-top: 1px dashed #94a3b8;
                font-size: 11px;
                color: #475569;
                display: flex;
                justify-content: space-between;
                gap: 8px;
              }
              @media print {
                body { background: #fff; }
                .sheet { margin: 0; border: 0; border-radius: 0; }
              }
            </style>
          </head>
          <body>
            <div class="sheet">
              <div class="header">
                <div class="brand">
                  <img class="logo" src="${logoUrl}" alt="EduTrack Logo" />
                  <div class="title">
                    <h1>EduTrack Booking Verification</h1>
                    <p>Official student and booking details report</p>
                  </div>
                </div>
                <div class="status-pill">STATUS: ${safe.status}</div>
              </div>
              <div class="content">
                <div class="grid">
                  <div class="card student">
                    <div class="label">Student Name</div><div class="value">${safe.requesterName}</div>
                    <div class="label">Student Email</div><div class="value">${safe.requesterEmail}</div>
                    <div class="label">IT Number</div><div class="value">${safe.requesterItNumber}</div>
                  </div>
                  <div>
                    <div class="card booking">
                      <div class="label">Booking ID</div><div class="value">${safe.id}</div>
                      <div class="label">Resource</div><div class="value">${safe.resourceType} - ${safe.resourceName}</div>
                      <div class="label">Date & Time</div><div class="value">${safe.bookingDate} | ${safe.startTime} - ${safe.endTime}</div>
                    </div>
                    <div class="card qrbox" style="margin-top: 12px;">
                      <img class="qr-img" src="${qrPreviewUrl}" alt="Booking QR" />
                      <div class="hint">Scan to open this booking again</div>
                    </div>
                  </div>
                </div>
                <div class="card purpose">
                  <div class="label">Purpose</div>
                  <div class="value">${safe.purpose}</div>
                </div>
                <div class="card status">
                  <div class="label">Check-in Status</div>
                  <div class="value">${safe.checkedIn} ${safe.checkedInAt === 'Not yet' ? '' : `| ${safe.checkedInAt}`}</div>
                </div>
                <div class="footer">
                  <div>Generated on ${new Date().toLocaleString()}</div>
                  <div>EduTrack | Secure Smart Campus Booking</div>
                </div>
              </div>
            </div>
            <script>
              window.onload = function () {
                setTimeout(function () {
                  window.focus();
                  window.print();
                }, 500);
              };
            </script>
          </body>
        </html>
      `

      printWindow.document.open()
      printWindow.document.write(html)
      printWindow.document.close()
      setMessage('Colorful PDF view opened. Choose Save as PDF in the print dialog.')
    } catch (pdfError) {
      setError(`Failed to download PDF: ${pdfError.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-orange-50 to-indigo-100 p-4 sm:p-6">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-2xl font-black text-slate-900">QR Booking Details</h1>
          <Link to="/" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Home</Link>
        </div>

        {loading ? <p className="rounded-lg bg-sky-100 px-3 py-2 text-sm text-sky-800">Loading booking details...</p> : null}
        {message ? <p className="mb-3 rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mb-3 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

        {booking ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-slate-900">Booking #{booking.id}</p>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>{booking.status}</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                <p className="text-sm font-bold text-sky-900">Student Details</p>
                <p className={cardLabel}>Full Name</p>
                <p className={cardValue}>{booking.requesterName}</p>
                <p className={cardLabel}>Email</p>
                <p className={cardValue}>{booking.requesterEmail}</p>
                <p className={cardLabel}>IT Number</p>
                <p className={cardValue}>{booking.requesterItNumber}</p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-900">Booking Details</p>
                <p className={cardLabel}>Resource</p>
                <p className={cardValue}>{booking.resourceType} - {booking.resourceName}</p>
                <p className={cardLabel}>Date</p>
                <p className={cardValue}>{booking.bookingDate}</p>
                <p className={cardLabel}>Time</p>
                <p className={cardValue}>{booking.startTime} - {booking.endTime}</p>
              </div>
            </div>

            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
              <p className="text-sm font-bold text-indigo-900">Purpose</p>
              <p className="mt-1 text-sm text-slate-800">{booking.purpose}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <p className="text-xs text-slate-600">Checked In: <span className="font-semibold text-slate-900">{booking.checkedIn ? 'Yes' : 'No'}</span></p>
                <p className="text-xs text-slate-600">Checked In At: <span className="font-semibold text-slate-900">{booking.checkedInAt || 'Not yet'}</span></p>
              </div>
            </div>

            <button onClick={() => void onDownloadPdf()} className="rounded-xl bg-linear-to-r from-blue-700 via-indigo-700 to-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg">
              Download Colorful PDF
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default BookingQrDetailsPage
