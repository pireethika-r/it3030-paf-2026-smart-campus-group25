import { useNavigate } from 'react-router-dom'
import logo from '../assets/edutrack.png'
import { getAuthUser } from '../auth/roles.js'

const reportCards = [
  { label: 'Approvals today', value: '26' },
  { label: 'Incidents escalated', value: '7' },
  { label: 'Teams active', value: '4' },
]

const reportItems = [
  { title: 'Monthly booking audit', description: 'Review faculty allocations and exception handling.' },
  { title: 'Incident SLA review', description: 'Track overdue maintenance and resolve bottlenecks.' },
  { title: 'Resource utilization', description: 'Check asset use across faculties and labs.' },
]

const ManagerDashboard = () => {
  const navigate = useNavigate()
  const user = getAuthUser()

  const handleLogout = () => {
    localStorage.removeItem('auth_user')
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef] p-3 sm:p-5">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl gap-4 rounded-[2rem] border border-amber-100 bg-white p-4 shadow-xl lg:grid-cols-[300px_minmax(0,1fr)] lg:p-6">
        <aside className="rounded-[1.5rem] bg-amber-950 p-5 text-white">
          <div className="flex items-center gap-3">
            <img src={logo} alt="EduTrack logo" className="h-10 w-10 rounded-xl object-cover" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Manager Console</p>
              <h1 className="text-2xl font-black">Operations Control</h1>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-100">Signed in as</p>
            <p className="mt-2 text-xl font-bold">{user?.fullName || 'Manager'}</p>
            <p className="text-sm text-amber-100">{user?.email}</p>
            <p className="mt-2 inline-flex rounded-full bg-amber-300/20 px-2 py-1 text-xs font-semibold text-amber-100">MANAGER</p>
          </div>

          <div className="mt-6 space-y-2 text-sm text-amber-50">
            <p className="rounded-xl bg-white/10 px-3 py-2 font-semibold">Reports</p>
            <p className="rounded-xl px-3 py-2 hover:bg-white/10">Approvals</p>
            <p className="rounded-xl px-3 py-2 hover:bg-white/10">Escalations</p>
          </div>

          <button onClick={handleLogout} className="mt-8 w-full rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold hover:bg-white/10">
            Logout
          </button>
        </aside>

        <main className="rounded-[1.5rem] border border-slate-200 bg-white p-5 sm:p-6">
          <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Manager Dashboard</p>
              <h2 className="text-2xl font-black text-slate-900">Reports and approvals</h2>
            </div>
            <button className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white">Open Reports</button>
          </header>

          <section className="mt-5 grid gap-4 md:grid-cols-3">
            {reportCards.map((metric) => (
              <article key={metric.label} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{metric.value}</p>
              </article>
            ))}
          </section>

          <section className="mt-6">
            <h3 className="text-xl font-black text-slate-900">Priority reports</h3>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {reportItems.map((item) => (
                <article key={item.title} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-bold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-500">{item.description}</p>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default ManagerDashboard