import React from 'react'
import clsx from 'clsx'

/**
 * Card Component - Container for content with consistent styling
 * @param {React.ReactNode} children - Card content
 * @param {string} className - Additional classes
 * @param {boolean} interactive - Add hover effects
 * @param {Function} onClick - Click handler for interactive cards
 */
export function Card({
  children,
  className = '',
  interactive = false,
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-lg shadow-md border border-gray-200 p-4',
        interactive && 'cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Badge Component - Label or tag component
 * @param {React.ReactNode} children - Badge content
 * @param {string} variant - 'default', 'success', 'warning', 'danger', 'info'
 * @param {string} size - 'sm', 'md', 'lg'
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  }
  
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }
  
  return (
    <span
      className={clsx(
        'inline-block rounded-full font-semibold',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

/**
 * Loading Spinner Component
 * @param {string} size - 'sm', 'md', 'lg'
 * @param {string} className - Additional classes
 */
export function Spinner({
  size = 'md',
  className = '',
  ...props
}) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }
  
  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-4 border-gray-300 border-t-blue-500',
        sizes[size],
        className
      )}
      {...props}
    />
  )
}

/**
 * Toast/Alert Component
 * @param {string} message - Alert message
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {Function} onClose - Close handler
 */
export function Alert({
  message,
  type = 'info',
  onClose,
  autoClose = true,
  duration = 5000,
  className = '',
  ...props
}) {
  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [autoClose, duration, onClose])
  
  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }
  
  return (
    <div
      className={clsx(
        'border rounded-lg p-4 flex justify-between items-center',
        typeStyles[type],
        className
      )}
      {...props}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="text-xl font-bold opacity-50 hover:opacity-100 transition-opacity"
      >
        ×
      </button>
    </div>
  )
}

/**
 * Modal/Dialog Component
 * @param {boolean} isOpen - Open state
 * @param {Function} onClose - Close handler
 * @param {React.ReactNode} children - Modal content
 * @param {string} title - Modal title
 */
export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  className = '',
  ...props
}) {
  if (!isOpen) return null
  
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl'
  }
  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className={clsx(
          'bg-white rounded-lg shadow-lg p-6 w-full mx-4',
          sizes[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-2xl font-bold text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default { Card, Badge, Spinner, Alert, Modal }
