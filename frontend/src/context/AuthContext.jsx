import { createContext, useContext, useEffect, useState } from 'react'
import * as authApi from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function bootstrap() {
      try {
        await authApi.fetchCsrf()
        const res = await authApi.fetchMe()
        setMember(res.data)
      } catch {
        setMember(null)
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
  }, [])

  async function login(id, password) {
    const res = await authApi.login(id, password)
    setMember(res.data)
  }

  async function logout() {
    await authApi.logout()
    setMember(null)
  }

  async function signup(payload) {
    const res = await authApi.signup(payload)
    setMember(res.data)
  }

  async function updateProfile(payload) {
    const res = await authApi.updateMe(payload)
    setMember(res.data)
    return res.data
  }

  return (
    <AuthContext.Provider value={{ member, loading, login, logout, signup, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
