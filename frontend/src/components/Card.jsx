export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur shadow-lg ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return <div className={`px-6 py-4 border-b border-white/20 ${className}`}>{children}</div>
}

export function CardContent({ children, className = '' }) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>
}


