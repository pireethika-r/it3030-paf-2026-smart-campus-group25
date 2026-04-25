import { useNavigate } from 'react-router-dom'
import logo from '../assets/edutrack.png'
import { getAuthUser } from '../auth/roles.js'

const workOrders = [
  { title: 'Projector replacement - Hall A3', status: 'Assigned', priority: 'High' },
  { title: 'AC inspection - Lab C2', status: 'In progress', priority: 'Medium' },
  { title: 'Network port fault - Admin block', status: 'Queued', priority: 'Low' },
]

const technicianMetrics = [
  { label: 'Open work orders', value: '14' },
  { label: 'Resolved this week', value: '39' },
  { label: 'Average response', value: '18 min' },
]

const TechnicianDashboard = () => {
  const navigate = useNavigate()
  const user = getAuthUser()

  const handleLogout = () => {
    localStorage.removeItem('auth_user')
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#f1f7fb] p-3 sm:p-5">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl gap-4 rounded-[2rem] border border-cyan-100 bg-white p-4 shadow-xl lg:grid-cols-[280px_minmax(0,1fr)] lg:p-6">
        <aside className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
          <div className="flex items-center gap-3">
            <img src={logo} alt="EduTrack logo" className="h-10 w-10 rounded-xl object-cover" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Technician Desk</p>
              <h1 className="text-2xl font-black">Maintenance Hub</h1>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-cyan-100">Signed in as</p>
            <p className="mt-2 text-xl font-bold">{user?.fullName || 'Technician'}</p>
            <p className="text-sm text-cyan-100">{user?.email}</p>
            <p className="mt-2 inline-flex rounded-full bg-cyan-400/20 px-2 py-1 text-xs font-semibold text-cyan-100">TECHNICIAN</p>
          </div>

          <div className="mt-6 space-y-2 text-sm text-slate-200">
            <p className="rounded-xl bg-white/10 px-3 py-2 font-semibold">Work Orders</p>
            <p className="rounded-xl px-3 py-2 hover:bg-white/10">Assets</p>
            <p className="rounded-xl px-3 py-2 hover:bg-white/10">Service Logs</p>
          </div>

          <button onClick={handleLogout} className="mt-8 w-full rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold hover:bg-white/10">
            Logout
          </button>
        </aside>

        <main className="rounded-[1.5rem] border border-slate-200 bg-white p-5 sm:p-6">
          <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Technician Dashboard</p>
              <h2 className="text-2xl font-black text-slate-900">Tasks and maintenance flow</h2>
            </div>
            <button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white">New Work Order</button>
          </header>

          <section className="mt-5 grid gap-4 md:grid-cols-3">
            {technicianMetrics.map((metric) => (
              <article key={metric.label} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{metric.value}</p>
              </article>
            ))}
          </section>

          <section className="mt-6">
            <h3 className="text-xl font-black text-slate-900">Active work orders</h3>
            <div className="mt-4 space-y-3">
              {workOrders.map((order) => (
                <div key={order.title} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{order.title}</p>
                      <p className="text-sm text-slate-500">Priority: {order.priority}</p>
                    </div>
                    <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default TechnicianDashboard