export const ROLES = {
  USER: 'USER',
  TECHNICIAN: 'TECHNICIAN',
  MANAGER: 'MANAGER',
  ADMIN: 'ADMIN',
}

const ROLE_ORDER = [ROLES.USER, ROLES.TECHNICIAN, ROLES.MANAGER, ROLES.ADMIN]

const DASHBOARD_PATHS = {
  [ROLES.USER]: '/dashboard',
  [ROLES.TECHNICIAN]: '/technician/dashboard',
  [ROLES.MANAGER]: '/manager/dashboard',
  [ROLES.ADMIN]: '/admin/dashboard',
}

export const normalizeRole = (role) => {
  if (!role) {
    return ROLES.USER
  }

  const normalized = String(role).trim().toUpperCase()
  if (normalized === 'STUDENT') {
    return ROLES.USER
  }

  return ROLE_ORDER.includes(normalized) ? normalized : ROLES.USER
}

export const getDashboardPath = (role) => DASHBOARD_PATHS[normalizeRole(role)] ?? DASHBOARD_PATHS[ROLES.USER]

export const hasMinimumRole = (userRole, minimumRole) => {
  const normalizedUserRole = normalizeRole(userRole)
  const normalizedMinimumRole = normalizeRole(minimumRole)

  return ROLE_ORDER.indexOf(normalizedUserRole) >= ROLE_ORDER.indexOf(normalizedMinimumRole)
}

export const getAuthUser = () => {
  const savedUser = localStorage.getItem('auth_user')

  if (!savedUser) {
    return null
  }

  try {
    const parsedUser = JSON.parse(savedUser)
    return {
      ...parsedUser,
      role: normalizeRole(parsedUser.role),
    }
  } catch {
    return null
  }
}