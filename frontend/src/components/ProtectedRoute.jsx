import { Navigate, useLocation } from 'react-router-dom'
import { getAuthUser, getDashboardPath, hasMinimumRole } from '../auth/roles.js'

const ProtectedRoute = ({ minRole, children }) => {
  const location = useLocation()
  const user = getAuthUser()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (minRole && !hasMinimumRole(user.role, minRole)) {
    return <Navigate to={getDashboardPath(user.role)} replace />
  }

  return children
}

export default ProtectedRoute