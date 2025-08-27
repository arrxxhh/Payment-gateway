export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-xl border border-gray-300/70 dark:border-white/10 bg-white/70 dark:bg-white/10 px-4 py-2.5 outline-none focus:ring-4 focus:ring-indigo-200/60 dark:focus:ring-indigo-500/30 ${className}`}
      {...props}
    />
  )
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full rounded-xl border border-gray-300/70 dark:border-white/10 bg-white/70 dark:bg-white/10 px-4 py-2.5 outline-none focus:ring-4 focus:ring-indigo-200/60 dark:focus:ring-indigo-500/30 ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}


