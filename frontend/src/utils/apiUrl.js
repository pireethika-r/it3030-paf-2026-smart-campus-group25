const stripTrailingSlash = (value) => String(value || '').replace(/\/$/, '')

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

const isPrivateIpv4 = (host) => {
  if (!host) {
    return false
  }

  return /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(host)
}

const shouldPreferCurrentHost = (configuredBase) => {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const configured = new URL(configuredBase)
    const currentHost = window.location.hostname || 'localhost'
    const configuredHost = configured.hostname

    if (LOCAL_HOSTS.has(configuredHost)) {
      return false
    }

    // If env has a stale private IP from a previous network, use the active host.
    return isPrivateIpv4(configuredHost) && configuredHost !== currentHost
  } catch {
    return false
  }
}

const toApiFromCurrentHost = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:8081'
  }

  const protocol = window.location.protocol || 'http:'
  const host = window.location.hostname || 'localhost'
  return `${protocol}//${host}:8081`
}

export const resolveApiBase = () => {
  const configured = (import.meta.env.VITE_API_BASE_URL || '').trim()
  if (configured && !shouldPreferCurrentHost(configured)) {
    return stripTrailingSlash(configured)
  }

  return stripTrailingSlash(toApiFromCurrentHost())
}
