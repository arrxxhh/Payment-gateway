import { useEffect } from 'react'

export default function Toast({ type = 'success', message, onClose }) {
  useEffect(() => {
    const t = setTimeout(() => onClose?.(), 3000)
    return () => clearTimeout(t)
  }, [onClose])
  const styles = type === 'success'
    ? 'from-emerald-500 to-green-500'
    : 'from-rose-500 to-red-500'
  return (
    <div className={`fixed left-1/2 -translate-x-1/2 top-6 z-[100] px-4 py-2 rounded-xl text-white shadow-xl bg-gradient-to-r ${styles}`}>
      {message}
    </div>
  )
}


