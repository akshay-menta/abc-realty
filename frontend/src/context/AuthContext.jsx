import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('abc_token')
    if (token) {
      authApi.verify()
        .then(res => setAdmin(res.data.admin))
        .catch(() => localStorage.removeItem('abc_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    const res = await authApi.login({ username, password })
    localStorage.setItem('abc_token', res.data.access_token)
    setAdmin(res.data.admin)
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('abc_token')
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
