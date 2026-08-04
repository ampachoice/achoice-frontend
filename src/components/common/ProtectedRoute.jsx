import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import api from '../services/api'
import { getHomePathForUser } from '../utils/authRedirect'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({
  children,
  adminOnly = false,
  allowedRoles = null,
}) {
  const auth = useAuth()
  const token = localStorage.getItem('token')
  const expiresAt = localStorage.getItem('session_expires_at')
  const user = auth?.user || JSON.parse(localStorage.getItem('user') || 'null')

  useEffect(() => {
    if (!token || !user) return

    const checkStatus = async () => {
      try {
        const res = await api.get('/me')
        if (res.data?.role) {
          localStorage.setItem('user', JSON.stringify(res.data))
          if (auth?.setUser) {
            auth.setUser(res.data)
          }
        }
      } catch (err) {
        // Interceptor handles banned accounts
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [token])

  if (auth?.loading) {
    return null
  }

  if (!token || !user || !expiresAt) {
    return <Navigate to="/login" replace />
  }

  const now = new Date().getTime()
  if (now > Number(expiresAt)) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('session_expires_at')
    if (auth?.setUser) auth.setUser(null)
    return <Navigate to="/login" replace />
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to={getHomePathForUser(user)} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomePathForUser(user)} replace />
  }

  return children
}