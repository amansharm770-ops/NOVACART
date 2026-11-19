import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'

const AuthContext = createContext(null)
const HINT = 'novacart_session'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(HINT)))

  // Only ask the server who we are if this browser has logged in before.
  useEffect(() => {
    if (!localStorage.getItem(HINT)) return
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => localStorage.removeItem(HINT))
      .finally(() => setLoading(false))
  }, [])

  const start = useCallback(async (path, body) => {
    const d = await api(path, { method: 'POST', body })
    localStorage.setItem(HINT, '1')
    setUser(d.user)
    return d.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' })
    } finally {
      localStorage.removeItem(HINT)
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login: (b) => start('/auth/login', b),
      register: (b) => start('/auth/register', b),
      adminLogin: (b) => start('/auth/admin/login', b),
      logout,
    }),
    [user, loading, start, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
