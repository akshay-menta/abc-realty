import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Lock, User, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import './AdminLogin.css'

export default function AdminLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.username, form.password)
      toast.success('Welcome back!')
      navigate('/admin')
    } catch {
      toast.error('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-page page-enter">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">A</div>
          <div className="login-logo-text">ABC Realty</div>
          <div className="login-logo-sub">Admin Portal</div>
        </div>

        <h1 className="login-title">Sign In</h1>
        <p className="login-subtitle">Access the property management dashboard</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <User size={16} className="login-field-icon" />
            <input
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              className="login-input"
              required
              autoComplete="username"
            />
          </div>
          <div className="login-field">
            <Lock size={16} className="login-field-icon" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="login-input"
              required
              autoComplete="current-password"
            />
            <button type="button" className="show-pass-btn" onClick={() => setShowPass(!showPass)}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
