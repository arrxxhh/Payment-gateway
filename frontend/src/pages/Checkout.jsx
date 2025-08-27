import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../lib/api.js'
import { Card, CardContent, CardHeader } from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import { Input, Select } from '../components/Input.jsx'
import Toast from '../components/Toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Checkout() {
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('UPI')
  const [sandbox, setSandbox] = useState(true)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const api = apiClient()
      const res = await api.post('/checkout', { amount: Number(amount), method, sandbox })
      setResult(res.data)
      const tType = res.data.status === 'SUCCESS' ? 'success' : 'error'
      setToast({ type: tType, message: `Payment ${res.data.status}` })
      // Stay on this page; user can click through to dashboard if they want
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.error || 'Payment failed' })
    } finally {
      setLoading(false)
      setTimeout(()=>setToast(null), 3000)
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      <Card className="bg-white/70 dark:bg-white/10">
        <CardHeader>
          <h1 className="text-2xl font-semibold">Checkout</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Amount" value={amount} onChange={e=>setAmount(e.target.value)} type="number" min="1" step="0.01" />
            <Select value={method} onChange={e=>setMethod(e.target.value)}>
              <option>UPI</option>
              <option>Card</option>
            </Select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sandbox} onChange={e=>setSandbox(e.target.checked)} />
              Sandbox mode
            </label>
            <Button disabled={loading} className="w-full h-11">
              {loading ? 'Processing…' : 'Pay Now'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className="bg-white/70 dark:bg-white/10">
        <CardHeader>
          <h2 className="text-xl font-semibold">Result</h2>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-2">
              <div><span className="opacity-70">Transaction ID</span><div className="font-mono text-sm">{result.txnId}</div></div>
              <div>
                <span className="opacity-70">Status</span>
                <div className={`inline-flex ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                  result.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : result.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}>{result.status}</div>
              </div>
              {result.paymentLink && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="opacity-70">Payment Link</span>
                  <a className="text-indigo-600 hover:underline" href={result.paymentLink} target="_blank" rel="noreferrer">Open</a>
                </div>
              )}
              <div className="pt-2">
                <Link to="/dashboard" className="text-indigo-600 hover:underline text-sm">View in Dashboard →</Link>
              </div>
            </div>
          ) : (
            <div className="opacity-60">No transaction yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


