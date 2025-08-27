export default function Spinner({ className = '' }) {
  return (
    <div className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent text-indigo-600 dark:text-indigo-400 ${className}`} role="status" aria-label="loading" />
  )
}


