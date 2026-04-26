import React from 'react'
import clsx from 'clsx'

/**
 * Button Component - Reusable with multiple variants
 * @param {React.ReactNode} children - Button content
 * @param {string} variant - 'primary', 'secondary', 'danger', 'ghost'
 * @param {string} size - 'sm', 'md', 'lg'
 * @param {boolean} loading - Show loading state
 * @param {boolean} disabled - Disable button
 * @param {Function} onClick - Click handler
 * @param {string} className - Additional classes
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2'
  
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
    ghost: 'bg-transparent text-blue-500 hover:bg-blue-50 active:bg-blue-100'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        (disabled || loading) && 'opacity-60 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <span className="animate-spin">⟳</span>
          {children}
        </>
      ) : (
        children
      )}
    </button>
  )
}

export default Button
