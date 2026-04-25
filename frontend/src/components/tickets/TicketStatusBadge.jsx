const statusClasses = {
  OPEN: 'bg-[#e6f4fb] text-[#0f4a6a] border-[#b7d9ea]',
  IN_PROGRESS: 'bg-[#e9eef8] text-[#233f7a] border-[#c8d7f1]',
  AWAITING_FOR_REPLY: 'bg-[#eef4ff] text-[#1d4d99] border-[#cdddf8]',
  RESOLVED: 'bg-[#e8f7f1] text-[#16684c] border-[#b8e3d3]',
  CLOSED: 'bg-[#edf0f5] text-[#4a5c78] border-[#ccd5e2]',
  REJECTED: 'bg-[#fff0f0] text-[#9f2f2f] border-[#f6cfcf]',
}

const formatStatusLabel = (status) => String(status || '').replaceAll('_', ' ')

const TicketStatusBadge = ({ status }) => {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusClasses[status] || 'bg-[#eef2f7] text-[#4a5c78] border-[#d5deea]'}`}>
      {formatStatusLabel(status)}
    </span>
  )
}

export default TicketStatusBadge