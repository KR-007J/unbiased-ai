import React from 'react'
import clsx from 'clsx'

/**
 * TextInput Component
 * @param {string} label - Input label
 * @param {string} error - Error message
 * @param {boolean} required - Required field
 */
export function TextInput({
  label,
  error,
  required = false,
  placeholder,
  value,
  onChange,
  disabled = false,
  type = 'text',
  className = '',
  ...props
}) {
  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {label && (
        <label className="text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={clsx(
          'px-4 py-2 border rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          error ? 'border-red-500 bg-red-50' : 'border-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        {...props}
      />
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  )
}

/**
 * TextArea Component
 * @param {string} label - Input label
 * @param {string} error - Error message
 * @param {number} rows - Number of rows
 */
export function TextArea({
  label,
  error,
  required = false,
  placeholder,
  value,
  onChange,
  disabled = false,
  rows = 4,
  maxLength,
  className = '',
  showCharCount = false,
  ...props
}) {
  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {label && (
        <label className="text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={clsx(
          'px-4 py-2 border rounded-lg transition-colors resize-none',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          error ? 'border-red-500 bg-red-50' : 'border-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        {...props}
      />
      <div className="flex justify-between items-center">
        {error && <span className="text-sm text-red-500">{error}</span>}
        {showCharCount && maxLength && (
          <span className="text-xs text-gray-500">
            {value.length} / {maxLength}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Select Component
 * @param {Array} options - Array of {value, label} objects
 * @param {string} label - Input label
 * @param {string} error - Error message
 */
export function Select({
  label,
  error,
  required = false,
  options = [],
  value,
  onChange,
  disabled = false,
  placeholder = 'Select an option...',
  className = '',
  ...props
}) {
  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {label && (
        <label className="text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={clsx(
          'px-4 py-2 border rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          error ? 'border-red-500 bg-red-50' : 'border-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  )
}

/**
 * Checkbox Component
 * @param {string} label - Checkbox label
 * @param {boolean} checked - Checked state
 */
export function Checkbox({
  label,
  checked = false,
  onChange,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <label className={clsx('flex items-center gap-2 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-4 h-4 rounded border-gray-300 focus:ring-blue-500"
        {...props}
      />
      <span className="text-sm">{label}</span>
    </label>
  )
}

/**
 * File Upload Component
 * @param {Function} onFilesSelected - Callback when files are selected
 * @param {string} accept - Accepted file types
 * @param {boolean} multiple - Allow multiple files
 */
export function FileUpload({
  label,
  onFilesSelected,
  accept = '*',
  multiple = false,
  disabled = false,
  className = '',
  maxSize = 10 * 1024 * 1024, // 10MB
  ...props
}) {
  const [dragActive, setDragActive] = React.useState(false)
  
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }
  
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    validateAndUpload(files)
  }
  
  const handleChange = (e) => {
    const files = Array.from(e.target.files)
    validateAndUpload(files)
  }
  
  const validateAndUpload = (files) => {
    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large`)
        return false
      }
      return true
    })
    
    if (validFiles.length > 0) {
      onFilesSelected(validFiles)
    }
  }
  
  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={clsx(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          type="file"
          onChange={handleChange}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="hidden"
          id="file-upload"
          {...props}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <p className="text-sm font-medium text-gray-700">
            Drag files here or click to select
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {accept === '*' ? 'Any format' : `Supported: ${accept}`}
          </p>
        </label>
      </div>
    </div>
  )
}

/**
 * Form Component - Wrapper for form elements
 * @param {React.ReactNode} children - Form content
 * @param {Function} onSubmit - Form submit handler
 */
export function Form({
  children,
  onSubmit,
  className = '',
  ...props
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className={clsx('flex flex-col gap-4', className)}
      {...props}
    >
      {children}
    </form>
  )
}

export default {
  TextInput,
  TextArea,
  Select,
  Checkbox,
  FileUpload,
  Form
}
