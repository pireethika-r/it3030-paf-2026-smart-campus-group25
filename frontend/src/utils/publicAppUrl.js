const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

const stripTrailingSlash = (value) => value.replace(/\/$/, '')

const isPrivateIpv4 = (host) => {
  if (!host) {
    return false
  }

  return /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(host)
}

const shouldPreferCurrentHost = (configuredBase) => {
  try {
    const parsed = new URL(configuredBase)
    const currentHost = window.location.hostname || 'localhost'
    const configuredHost = parsed.hostname

    if (LOCAL_HOSTS.has(configuredHost)) {
      return false
    }

    return isPrivateIpv4(configuredHost) && configuredHost !== currentHost
  } catch {
    return false
  }
}

const isLocalAddress = (value) => {
  if (!value) {
    return true
  }

  try {
    const parsed = new URL(value)
    return LOCAL_HOSTS.has(parsed.hostname)
  } catch {
    return true
  }
}

export const resolvePublicAppBase = () => {
  const configuredBase = (import.meta.env.VITE_PUBLIC_APP_URL || '').trim()

  // Ignore localhost config so QR links can follow the active host on LAN.
  if (configuredBase && !isLocalAddress(configuredBase) && !shouldPreferCurrentHost(configuredBase)) {
    return stripTrailingSlash(configuredBase)
  }

  return stripTrailingSlash(window.location.origin)
}

export const isCrossDeviceUnsafeBase = () => {
  return isLocalAddress(resolvePublicAppBase())
}

export const resolveQrScanBase = () => {
  const configuredBase = (import.meta.env.VITE_QR_SCAN_BASE_URL || '').trim()
  if (configuredBase) {
    return stripTrailingSlash(configuredBase)
  }

  return resolvePublicAppBase()
}

export const buildQrScanUrl = (token) => {
  return `${resolveQrScanBase()}/bookings/scan/${encodeURIComponent(token || '')}`
}