import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import logo from '../assets/edutrack.png'

const highlights = [
  {
    title: 'Facility and Asset Booking',
    description: 'Book lecture halls, labs, and equipment with clear approval flow and live availability.',
  },
  {
    title: 'Maintenance and Incident Handling',
    description: 'Report faults, track technician updates, and close issues with accountable resolution notes.',
  },
  {
    title: 'Role-Based and Auditable',
    description: 'Students, staff, admins, and technicians all work through one transparent workflow history.',
  },
]

const workflow = [
  {
    title: 'Choose a resource',
    description: 'Browse rooms, labs, and equipment with capacity, zone, and live booking context.',
  },
  {
    title: 'Submit a request',
    description: 'Send a booking with date, time, attendees, and purpose in one clean form.',
  },
  {
    title: 'Track the result',
    description: 'Watch approval status, notifications, and your request history from the dashboard.',
  },
]

const Home = () => {

  // 🔥 Animated counters
  const [count, setCount] = useState({ bookings: 0, incidents: 0 })

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      i++
      setCount({
        bookings: Math.min(426, i * 8),
        incidents: Math.min(38, Math.floor(i / 2)),
      })
      if (i > 60) clearInterval(interval)
    }, 20)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <img src={logo} className="h-10 w-10 rounded-xl" />
            <div>
              <h1 className="text-xl font-black">EduTrack</h1>
              <p className="text-xs text-slate-500">Smart Campus Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 rounded-lg border hover:bg-slate-100">
              Login
            </Link>

            <Link to="/signup" className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-7xl px-6 py-12">

        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/50 backdrop-blur-xl p-10 shadow-xl">

          {/* blobs */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-300/40 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-300/40 rounded-full blur-3xl"></div>

          <div className="relative z-10 grid lg:grid-cols-2 gap-10">

            <div>
              <h2 className="text-4xl font-black leading-tight">
                Smart Campus Management Platform
              </h2>
              <p className="mt-4 text-slate-600">
                Manage bookings, maintenance, and campus operations with one powerful system.
              </p>

              <div className="mt-6 flex gap-3">
                <Link to="/signup" className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-indigo-700">
                  Get Started
                </Link>
                <Link to="/login" className="border px-5 py-3 rounded-xl hover:bg-slate-100">
                  Login
                </Link>
              </div>
            </div>

            {/* 🔥 Animated Stats */}
            <div className="grid gap-4">

              <div className="rounded-2xl p-6 bg-white/60 backdrop-blur-xl shadow-sm">
                <p className="text-sm text-slate-500">Bookings Today</p>
                <p className="text-3xl font-black text-indigo-600">{count.bookings}</p>
              </div>

              <div className="rounded-2xl p-6 bg-white/60 backdrop-blur-xl shadow-sm">
                <p className="text-sm text-slate-500">Open Incidents</p>
                <p className="text-3xl font-black text-purple-600">{count.incidents}</p>
              </div>

            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="mt-10 grid md:grid-cols-3 gap-5">
          {highlights.map((item) => (
            <div key={item.title} className="rounded-2xl p-6 bg-white/60 backdrop-blur-xl shadow-sm">
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </div>
          ))}
        </section>

        {/* WORKFLOW */}
        <section className="mt-10">
          <h3 className="text-2xl font-black mb-5">How it works</h3>

          <div className="grid md:grid-cols-3 gap-5">
            {workflow.map((item, index) => (
              <div key={item.title} className="rounded-2xl p-6 bg-white/60 backdrop-blur-xl shadow-sm">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 text-white font-bold">
                  {index + 1}
                </div>
                <h4 className="mt-4 font-bold">{item.title}</h4>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        EduTrack Smart Campus © 2026
      </footer>

    </div>
  )
}

export default Home

