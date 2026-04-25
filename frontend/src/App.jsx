import { Navigate, Route, Routes } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard.jsx'
import BookingApprovalPage from './pages/BookingApprovalPage.jsx'
import BookingCalendarPage from './pages/BookingCalendarPage.jsx'
import BookingFormPage from './pages/BookingFormPage.jsx'
import BookingQrDetailsPage from './pages/BookingQrDetailsPage.jsx'
import Booking from './pages/Booking.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import ManagerDashboard from './pages/ManagerDashboard.jsx'
import MyBookingsPage from './pages/MyBookingsPage.jsx'
import AddResourcePage from './pages/resources/AddResourcePage.jsx'
import ManageResourcePage from './pages/resources/ManageResourcePage.jsx'
import ResourceDetailsPage from './pages/resources/ResourceDetailsPage.jsx'
import ResourceListPage from './pages/resources/ResourceListPage.jsx'
import CreateTicketPage from './pages/tickets/CreateTicketPage.jsx'
import MyTicketsPage from './pages/tickets/MyTicketsPage.jsx'
import TicketDetailsPage from './pages/tickets/TicketDetailsPage.jsx'
import TicketManagementPage from './pages/tickets/TicketManagementPage.jsx'
import SignUp from './pages/SignUp.jsx'
import TechnicianDashboard from './pages/TechnicianDashboard.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { ROLES } from './auth/roles.js'
import OAuthSuccess from "./pages/OAuthSuccess.jsx"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/oauth-success" element={<OAuthSuccess />} />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute minRole={ROLES.USER}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resources"
        element={
          <ProtectedRoute minRole={ROLES.USER}>
            <ResourceListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/resources"
        element={
          <ProtectedRoute minRole={ROLES.ADMIN}>
            <ResourceListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resource/details/:id"
        element={
          <ProtectedRoute minRole={ROLES.USER}>
            <ResourceDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute minRole={ROLES.USER}>
            <Navigate to="/bookings/form" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/form"
        element={
          <ProtectedRoute minRole={ROLES.USER}>
            <BookingFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/booking"
        element={
          <ProtectedRoute minRole={ROLES.USER}>
            <Booking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/my"
        element={
          <ProtectedRoute minRole={ROLES.USER}>
            <MyBookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/approval"
        element={
          <ProtectedRoute minRole={ROLES.MANAGER}>
            <BookingApprovalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/calendar"
        element={
          <ProtectedRoute minRole={ROLES.USER}>
            <BookingCalendarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/scan/:token"
        element={
          <ProtectedRoute minRole={ROLES.USER}>
            <BookingQrDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/technician/dashboard"
        element={
          <ProtectedRoute minRole={ROLES.TECHNICIAN}>
            <TechnicianDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard"
        element={
          <ProtectedRoute minRole={ROLES.MANAGER}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute minRole={ROLES.ADMIN}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/resources/add"
        element={
          <ProtectedRoute minRole={ROLES.ADMIN}>
            <AddResourcePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/resources/manage/:id"
        element={
          <ProtectedRoute minRole={ROLES.ADMIN}>
            <ManageResourcePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets/new"
        element={
          <ProtectedRoute minRole={ROLES.USER}>
            <CreateTicketPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets/my"
        element={
          <ProtectedRoute minRole={ROLES.USER}>
            <MyTicketsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets/:id"
        element={
          <ProtectedRoute minRole={ROLES.USER}>
            <TicketDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets/manage"
        element={
          <ProtectedRoute minRole={ROLES.TECHNICIAN}>
            <TicketManagementPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
