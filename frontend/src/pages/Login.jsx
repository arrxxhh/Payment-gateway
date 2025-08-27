import { useState } from 'react'
import axios from 'axios'
import { Card, CardContent } from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import { Input } from '../components/Input.jsx'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${BASE_URL}/api/login`, { username, password })
      onLogin(res.data.token)
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-semibold leading-tight">Welcome back</h1>
        <p className="opacity-70">Sign in to continue to MiniPay</p>
      </div>
      <Card className="bg-white/70 dark:bg-white/10">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
            <Input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <Button disabled={loading} className="w-full h-11">
              {loading ? 'Logging in…' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


