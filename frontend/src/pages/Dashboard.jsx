import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiClient } from '../lib/api.js'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader } from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import Toast from '../components/Toast.jsx'

export default function Dashboard() {
  const [transactions, setTransactions] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [analyticsMethods, setAnalyticsMethods] = useState(null)
  const [analyticsSettlement, setAnalyticsSettlement] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState({ method: searchParams.get('method') || 'ALL', status: searchParams.get('status') || 'ALL', from: searchParams.get('from') || '', to: searchParams.get('to') || '' })
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  async function load() {
    setLoading(true)
    const api = apiClient()
    const query = new URLSearchParams()
    if (filter.status !== 'ALL') query.set('status', filter.status)
    if (filter.method !== 'ALL') query.set('method', filter.method)
    if (filter.from) query.set('dateFrom', filter.from)
    if (filter.to) query.set('dateTo', filter.to)
    const [t, a, am, as] = await Promise.all([
      api.get(`/transactions${query.toString() ? `?${query.toString()}` : ''}`),
      api.get('/analytics'),
      api.get('/analytics/methods'),
      api.get('/analytics/settlement'),
    ])
    setTransactions(t.data)
    setAnalytics(a.data)
    setAnalyticsMethods(am.data)
    setAnalyticsSettlement(as.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const sp = new URLSearchParams()
    if (filter.method !== 'ALL') sp.set('method', filter.method)
    if (filter.status !== 'ALL') sp.set('status', filter.status)
    if (filter.from) sp.set('from', filter.from)
    if (filter.to) sp.set('to', filter.to)
    setSearchParams(sp)
    setPage(1)
  }, [filter, setSearchParams])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => { load() }, 12000)
    return () => clearInterval(id)
  }, [autoRefresh])

  const filtered = useMemo(() => {
    let list = transactions
    if (filter.method !== 'ALL') list = list.filter(t => t.method === filter.method)
    if (filter.status !== 'ALL') {
      if (filter.status === 'SETTLED') list = list.filter(t => !!t.settlementDate)
      else list = list.filter(t => t.status === filter.status && !t.settlementDate)
    }
    return list
  }, [transactions, filter])

  const statusCounts = useMemo(() => {
    const counts = { SUCCESS: 0, FAILED: 0, PENDING: 0, SETTLED: 0, REFUNDED: 0 }
    for (const t of filtered) {
      if (t.settlementDate) counts.SETTLED += 1
      else counts[t.status] = (counts[t.status] || 0) + 1
      if (t.status === 'REFUNDED') counts.REFUNDED += 1
    }
    return [
      { name: 'FAILED', count: counts.FAILED },
      { name: 'PENDING', count: counts.PENDING },
      { name: 'SETTLED', count: counts.SETTLED },
      { name: 'REFUNDED', count: counts.REFUNDED },
    ]
  }, [filtered])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered.length, pageSize])
  const visibleRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold mr-auto">Dashboard</h1>
        <select className="rounded-xl border bg-white/70 dark:bg-white/10 px-3 py-2" value={filter.method} onChange={e=>setFilter({ ...filter, method: e.target.value })}>
          <option value="ALL">All Methods</option>
          <option value="UPI">UPI</option>
          <option value="Card">Card</option>
        </select>
        <select className="rounded-xl border bg-white/70 dark:bg-white/10 px-3 py-2" value={filter.status} onChange={e=>setFilter({ ...filter, status: e.target.value })}>
          <option value="ALL">All Statuses</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
          <option value="PENDING">PENDING</option>
          <option value="SETTLED">SETTLED</option>
          <option value="REFUNDED">REFUNDED</option>
        </select>
        <input type="date" className="rounded-xl border bg-white/70 dark:bg-white/10 px-3 py-2" value={filter.from} onChange={e=>setFilter({ ...filter, from: e.target.value })} />
        <input type="date" className="rounded-xl border bg-white/70 dark:bg-white/10 px-3 py-2" value={filter.to} onChange={e=>setFilter({ ...filter, to: e.target.value })} />
        <Button variant="outline" onClick={load}>Refresh</Button>
        <Button variant="outline" onClick={()=>setAutoRefresh(v=>!v)}>{autoRefresh ? 'Auto-refresh: On' : 'Auto-refresh: Off'}</Button>
      </div>

      {analytics && (
        <div className="grid md:grid-cols-4 gap-4">
          <Stat label="Total" value={analytics.total} />
          <Stat label="Success" value={analytics.success} />
          <Stat label="Failed" value={analytics.failed} />
          <Stat label="Revenue" value={`₹${analytics.revenue.toFixed(2)}`} />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-white/70 dark:bg-white/10">
          <CardHeader><h3 className="font-medium">Transactions by Status</h3></CardHeader>
          <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusCounts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count">
                  {statusCounts.map((entry, index) => {
                    const color = entry.name === 'SUCCESS' ? '#16a34a' : entry.name === 'FAILED' ? '#ef4444' : entry.name === 'PENDING' ? '#f59e0b' : entry.name === 'REFUNDED' ? '#eab308' : '#2563eb'
                    return <Cell key={`cell-${index}`} fill={color} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          </CardContent>
        </Card>
        <Card className="bg-white/70 dark:bg-white/10">
          <CardHeader><h3 className="font-medium">Revenue by Day</h3></CardHeader>
          <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(v)=> new Date(v).toLocaleDateString()} />
                <YAxis />
                <Tooltip labelFormatter={(v)=> new Date(v).toLocaleDateString()} />
                <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-white/70 dark:bg-white/10">
          <CardHeader><h3 className="font-medium">By Method</h3></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 items-center">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie dataKey="value" data={analyticsMethods ? [
                      { name: 'UPI', value: analyticsMethods.UPI.count },
                      { name: 'Card', value: analyticsMethods.Card.count },
                    ] : []} cx="50%" cy="50%" outerRadius={85} labelLine={false} label>
                      {['#6366F1','#22C55E'].map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                <MethodLegend color="#6366F1" label="UPI" value={analyticsMethods?.UPI?.count || 0} amount={analyticsMethods?.UPI?.amount || 0} />
                <MethodLegend color="#22C55E" label="Card" value={analyticsMethods?.Card?.count || 0} amount={analyticsMethods?.Card?.amount || 0} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/70 dark:bg-white/10">
          <CardHeader><h3 className="font-medium">Settlement Ratio</h3></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-6 items-center">
              <div className="flex items-center gap-6">
                <Ring value={analyticsSettlement ? Math.round(analyticsSettlement.ratio * 100) : 0} />
                <div>
                  <div className="text-3xl font-semibold">{analyticsSettlement ? Math.round(analyticsSettlement.ratio * 100) : 0}%</div>
                  <div className="opacity-70 text-sm">{analyticsSettlement ? `${analyticsSettlement.settled}/${analyticsSettlement.total} settled` : ''}</div>
                </div>
              </div>
              {analytics && (
                <div className="grid grid-cols-2 gap-4">
                  <MiniKPI title="Success Rate" value={`${Math.round(((analytics.success + analytics.settled) / Math.max(1, analytics.total)) * 100)}%`} hint={`${analytics.success + analytics.settled}/${analytics.total}`} />
                  <MiniKPI title="Refund Ratio" value={`${Math.round(((analytics.refunded || 0) / Math.max(1, analytics.total)) * 100)}%`} hint={`${analytics.refunded || 0}/${analytics.total}`} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/70 dark:bg-white/10">
        <CardHeader><div className="font-medium">Transactions</div></CardHeader>
        <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100/80 dark:bg-white/5">
              <tr>
                <Th><input type="checkbox" onChange={e => {
                  if (e.target.checked) setSelected(new Set(filtered.filter(t => t.status==='SUCCESS' && !t.settlementDate).map(t => t.txnId)))
                  else setSelected(new Set())
                }} /></Th>
                <Th>Txn ID</Th>
                <Th>Amount</Th>
                <Th>Method</Th>
                <Th>Status</Th>
                <Th>Timestamp</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {(loading ? [] : visibleRows).map((t, i) => (
                <tr key={i} className={`border-t ${t.riskFlag ? 'bg-red-50/40 dark:bg-red-900/10' : ''}`}>
                  <Td><input type="checkbox" disabled={t.status!=='SUCCESS' || !!t.settlementDate} checked={selected.has(t.txnId)} onChange={e => {
                    const ns = new Set(selected); if (e.target.checked) ns.add(t.txnId); else ns.delete(t.txnId); setSelected(ns);
                  }} /></Td>
                  <Td className="font-mono text-xs">{t.txnId}</Td>
                  <Td>₹{Number(t.amount).toFixed(2)}</Td>
                  <Td>{t.method}</Td>
                  <Td>
                    {t.settlementDate ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">SETTLED</span>
                    ) : (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.status==='SUCCESS' ? 'bg-green-100 text-green-700' :
                        t.status==='PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        t.status==='REFUNDED' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>{t.status}</span>
                    )}
                  </Td>
                  <Td>{new Date(t.timestamp).toLocaleString()}</Td>
                  <Td>
                    {t.status === 'SUCCESS' && !t.settlementDate && (
                      <Button
                        className="px-2 py-1 text-xs"
                        onClick={async ()=>{ 
                          try { const api = apiClient(); await api.post(`/settle/${t.txnId}`); setToast({ type: 'success', message: 'Settled successfully' }); }
                          catch (e) { setToast({ type: 'error', message: e?.response?.data?.error || 'Failed to settle' }); }
                          finally { await load(); }
                        }}
                      >Settle</Button>
                    )}
                    {t.status === 'SUCCESS' || t.settlementDate ? (
                      <Button
                        variant="outline"
                        className="px-2 py-1 text-xs ml-2"
                        onClick={async ()=>{ 
                          try { const api = apiClient(); await api.post(`/refund/${t.txnId}`); setToast({ type: 'success', message: 'Refunded successfully' }); }
                          catch (e) { setToast({ type: 'error', message: e?.response?.data?.error || 'Failed to refund' }); }
                          finally { await load(); }
                        }}
                      >Refund</Button>
                    ) : null}
                  </Td>
                </tr>
              ))}
              {(!loading && filtered.length === 0) && (
                <tr><Td colSpan={7} className="text-center text-gray-500 py-6">No transactions.</Td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t flex items-center justify-between">
          <div className="text-sm opacity-70">Selected: {selected.size}</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span>Rows:</span>
              <select className="rounded border bg-white/70 dark:bg-white/10 px-2 py-1" value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <Button variant="outline" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1, p-1))}>Prev</Button>
            <div className="text-sm">Page {page} / {totalPages}</div>
            <Button variant="outline" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages, p+1))}>Next</Button>
            <Button variant="outline" onClick={()=>exportCsv(filtered)}>Export CSV</Button>
            <Button disabled={selected.size===0} onClick={async ()=>{ const api = apiClient(); await api.post('/payout', { txnIds: Array.from(selected) }); setSelected(new Set()); await load(); }}>Batch Settle</Button>
          </div>
        </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur p-4 shadow">
      <div className="opacity-70 text-sm">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}

function Th({ children }) {
  return <th className="text-left px-3 py-2 font-medium">{children}</th>
}
function Td({ children, className = '', ...rest }) {
  return <td className={`px-3 py-2 ${className}`} {...rest}>{children}</td>
}

function MethodLegend({ color, label, value, amount }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: color }} />
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-sm tabular-nums">{value} • ₹{amount.toFixed(2)}</div>
    </div>
  )
}

function Ring({ value = 0 }) {
  const clamped = Math.max(0, Math.min(100, value))
  const circumference = 2 * Math.PI * 36
  const offset = circumference - (clamped / 100) * circumference
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="36" stroke="#e5e7eb" strokeWidth="10" fill="none" />
      <circle cx="50" cy="50" r="36" stroke="#10b981" strokeWidth="10" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 50 50)" />
    </svg>
  )
}

function MiniKPI({ title, value, hint }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur p-3">
      <div className="text-xs opacity-70">{title}</div>
      <div className="text-xl font-semibold">{value}</div>
      {hint && <div className="opacity-60 text-xs">{hint}</div>}
    </div>
  )
}

function exportCsv(rows) {
  const headers = ['txnId','amount','method','status','timestamp','settlementDate','sandbox']
  const csv = [headers.join(',')].concat(
    rows.map(r => [r.txnId, r.amount, r.method, r.settlementDate ? 'SETTLED' : r.status, new Date(r.timestamp).toISOString(), r.settlementDate ? new Date(r.settlementDate).toISOString() : '', r.sandbox ? 'YES' : 'NO'].join(','))
  ).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'transactions.csv'
  a.click()
  URL.revokeObjectURL(url)
}


