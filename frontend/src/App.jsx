import { useEffect, useState } from 'react'
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import Button from './components/Button.jsx'
import { useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import Checkout from './pages/Checkout.jsx'
import Dashboard from './pages/Dashboard.jsx'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { token, setToken } = useAuth()
  const navigate = useNavigate()
  const [dark, setDark] = useState(false)

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [dark])

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <nav className="flex items-center gap-6">
            <Link to="/" className="font-semibold text-lg bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">MiniPay</Link>
            {token && (
              <>
                <Link to="/checkout" className="text-sm opacity-90 hover:opacity-100">Checkout</Link>
                <Link to="/dashboard" className="text-sm opacity-90 hover:opacity-100">Dashboard</Link>
              </>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setDark(d => !d)} className="h-9 px-3">
              {dark ? 'Light' : 'Dark'}
            </Button>
            {token ? (
              <Button
                onClick={() => { setToken(null); navigate('/login') }}
                className="h-9"
              >Logout</Button>
            ) : (
              <Link to="/login"><Button className="h-9">Login</Button></Link>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login onLogin={(t) => { setToken(t); navigate('/dashboard') }} />} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </main>
    </div>
  )
}


