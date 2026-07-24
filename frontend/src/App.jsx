import { Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Chatbot from './components/Chatbot'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import Listings from './pages/Listings'
import PropertyDetail from './pages/PropertyDetail'
import Contact from './pages/Contact'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminPropertyList from './pages/admin/AdminPropertyList'
import PropertyForm from './pages/admin/PropertyForm'

// Wrapper to pass listingType prop to Listings
const SalePage  = () => <Listings listingType="sale" />
const LeasePage = () => <Listings listingType="lease" />

function AppShell() {
  const location = useLocation()
  const isPropertyDetail = location.pathname.startsWith('/property/')
  const isAdminLogin = location.pathname === '/admin/login'

  return (
    <>
      {/* Navbar: not on property detail (it opens in its own tab) */}
      {!isPropertyDetail && <Navbar />}

      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/sale" element={<SalePage />} />
        <Route path="/lease" element={<LeasePage />} />
        <Route path="/property/:slug" element={<PropertyDetail />} />
        <Route path="/contact" element={<Contact />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={
          <ProtectedRoute><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/properties" element={
          <ProtectedRoute><AdminPropertyList /></ProtectedRoute>
        } />
        <Route path="/admin/properties/new" element={
          <ProtectedRoute><PropertyForm /></ProtectedRoute>
        } />
        <Route path="/admin/properties/:id/edit" element={
          <ProtectedRoute><PropertyForm /></ProtectedRoute>
        } />

        {/* 404 */}
        <Route path="*" element={
          <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16}}>
            <h1 style={{fontFamily:'var(--font-serif)',fontSize:48,color:'var(--primary)'}}>404</h1>
            <p style={{color:'var(--gray-500)'}}>Page not found</p>
            <a href="/" className="btn btn-primary">Back to Home</a>
          </div>
        } />
      </Routes>

      {/* Footer: not on property detail or admin login */}
      {!isPropertyDetail && !isAdminLogin && <Footer />}

      {/* Chatbot: public pages only */}
      {!isPropertyDetail && !location.pathname.startsWith('/admin') && <Chatbot />}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a2744',
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            borderRadius: '12px',
          },
          success: {
            iconTheme: { primary: '#c9a96e', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
