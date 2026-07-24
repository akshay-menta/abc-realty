import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Menu, X, ChevronDown, LogOut, LayoutDashboard } from 'lucide-react'
import './Navbar.css'

export default function Navbar() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">A</div>
          <div className="logo-text">
            <span className="logo-name">ABC Realty</span>
            <span className="logo-tagline">Premium Properties</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="navbar-links hide-mobile">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Home</NavLink>
          <NavLink to="/sale" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>For Sale</NavLink>
          <NavLink to="/lease" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>For Lease</NavLink>
          <NavLink to="/contact" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Contact</NavLink>
          {admin && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={15} />
              Admin
            </NavLink>
          )}
        </div>

        {/* Actions */}
        <div className="navbar-actions hide-mobile">
          {admin ? (
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              <LogOut size={15} />
              Logout
            </button>
          ) : (
            <Link to="/admin/login" className="btn btn-primary btn-sm">
              Admin Login
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <Link to="/" onClick={() => setMenuOpen(false)} className="mobile-link">Home</Link>
        <Link to="/sale" onClick={() => setMenuOpen(false)} className="mobile-link">For Sale</Link>
        <Link to="/lease" onClick={() => setMenuOpen(false)} className="mobile-link">For Lease</Link>
        <Link to="/contact" onClick={() => setMenuOpen(false)} className="mobile-link">Contact</Link>
        {admin ? (
          <>
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="mobile-link">Admin Dashboard</Link>
            <button className="mobile-link" style={{background:'none',border:'none',textAlign:'left',color:'inherit'}} onClick={() => { handleLogout(); setMenuOpen(false) }}>Logout</button>
          </>
        ) : (
          <Link to="/admin/login" onClick={() => setMenuOpen(false)} className="mobile-link">Admin Login</Link>
        )}
      </div>
    </nav>
  )
}
