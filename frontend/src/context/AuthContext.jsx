import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => (token ? { id: 'admin' } : null))

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
      setUser({ id: 'admin' })
    } else {
      localStorage.removeItem('token')
      setUser(null)
    }
  }, [token])

  const value = useMemo(() => ({ token, setToken, user }), [token, user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}


