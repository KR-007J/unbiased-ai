import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Button, Card, Badge, Spinner, Alert, Modal } from '../components/library'
import { TextInput, TextArea, Select, Checkbox, FileUpload, Form } from '../components/library/Forms'

describe('Button Component', () => {
  it('renders button with children', () => {
    render(<Button>Click Me</Button>)
    expect(screen.getByText('Click Me')).toBeInTheDocument()
  })

  it('applies primary variant styles by default', () => {
    const { container } = render(<Button>Primary</Button>)
    expect(container.querySelector('button')).toHaveClass('bg-blue-500')
  })

  it('applies secondary variant styles', () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>)
    expect(container.querySelector('button')).toHaveClass('bg-gray-200')
  })

  it('applies danger variant styles', () => {
    const { container } = render(<Button variant="danger">Delete</Button>)
    expect(container.querySelector('button')).toHaveClass('bg-red-500')
  })

  it('calls onClick handler when clicked', () => {
    const onClick = jest.fn()
    render(<Button onClick={onClick}>Click</Button>)
    fireEvent.click(screen.getByText('Click'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByText('Disabled')).toBeDisabled()
  })

  it('shows loading state with spinner', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByText('Loading')).toBeInTheDocument()
    expect(screen.getByText('⟳')).toBeInTheDocument()
  })

  it('applies size variants correctly', () => {
    const { container: smallContainer } = render(<Button size="sm">Small</Button>)
    expect(smallContainer.querySelector('button')).toHaveClass('px-3', 'py-1.5')

    const { container: largeContainer } = render(<Button size="lg">Large</Button>)
    expect(largeContainer.querySelector('button')).toHaveClass('px-6', 'py-3')
  })
})

describe('Card Component', () => {
  it('renders card with children', () => {
    render(<Card>Card Content</Card>)
    expect(screen.getByText('Card Content')).toBeInTheDocument()
  })

  it('applies interactive styles when interactive prop is true', () => {
    const { container } = render(<Card interactive>Interactive</Card>)
    expect(container.querySelector('div')).toHaveClass('cursor-pointer')
  })

  it('calls onClick handler when interactive card is clicked', () => {
    const onClick = jest.fn()
    render(
      <Card interactive onClick={onClick}>
        Click Card
      </Card>
    )
    fireEvent.click(screen.getByText('Click Card'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('Badge Component', () => {
  it('renders badge with children', () => {
    render(<Badge>Success</Badge>)
    expect(screen.getByText('Success')).toBeInTheDocument()
  })

  it('applies success variant styles', () => {
    const { container } = render(<Badge variant="success">Done</Badge>)
    expect(container.querySelector('span')).toHaveClass('bg-green-100')
  })

  it('applies warning variant styles', () => {
    const { container } = render(<Badge variant="warning">Warning</Badge>)
    expect(container.querySelector('span')).toHaveClass('bg-yellow-100')
  })

  it('applies danger variant styles', () => {
    const { container } = render(<Badge variant="danger">Error</Badge>)
    expect(container.querySelector('span')).toHaveClass('bg-red-100')
  })

  it('applies correct size classes', () => {
    const { container: smallContainer } = render(<Badge size="sm">Small</Badge>)
    expect(smallContainer.querySelector('span')).toHaveClass('text-xs')

    const { container: largeContainer } = render(<Badge size="lg">Large</Badge>)
    expect(largeContainer.querySelector('span')).toHaveClass('text-base')
  })
})

describe('Spinner Component', () => {
  it('renders spinner with correct size', () => {
    const { container } = render(<Spinner size="md" />)
    expect(container.querySelector('div')).toHaveClass('animate-spin')
    expect(container.querySelector('div')).toHaveClass('w-8', 'h-8')
  })

  it('renders different sizes correctly', () => {
    const { container: smallContainer } = render(<Spinner size="sm" />)
    expect(smallContainer.querySelector('div')).toHaveClass('w-4', 'h-4')

    const { container: largeContainer } = render(<Spinner size="lg" />)
    expect(largeContainer.querySelector('div')).toHaveClass('w-12', 'h-12')
  })
})

describe('Alert Component', () => {
  it('renders alert with message', () => {
    const onClose = jest.fn()
    render(<Alert message="Test alert" onClose={onClose} />)
    expect(screen.getByText('Test alert')).toBeInTheDocument()
  })

  it('applies success type styles', () => {
    const { container } = render(<Alert message="Success" type="success" onClose={() => {}} />)
    expect(container.querySelector('div')).toHaveClass('bg-green-50')
  })

  it('applies error type styles', () => {
    const { container } = render(<Alert message="Error" type="error" onClose={() => {}} />)
    expect(container.querySelector('div')).toHaveClass('bg-red-50')
  })

  it('closes alert when close button is clicked', () => {
    const onClose = jest.fn()
    render(<Alert message="Alert" onClose={onClose} />)
    fireEvent.click(screen.getByText('×'))
    expect(onClose).toHaveBeenCalled()
  })

  it('auto-closes after duration if autoClose is true', async () => {
    const onClose = jest.fn()
    render(<Alert message="Alert" onClose={onClose} autoClose duration={1000} />)
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    }, { timeout: 1500 })
  })
})

describe('Modal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        Content
      </Modal>
    )
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        Content
      </Modal>
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Modal">
        Content
      </Modal>
    )
    fireEvent.click(screen.getByText('×'))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = jest.fn()
    const { container } = render(
      <Modal isOpen={true} onClose={onClose} title="Modal">
        Content
      </Modal>
    )
    fireEvent.click(container.querySelector('.fixed'))
    expect(onClose).toHaveBeenCalled()
  })

  it('does not close when modal content is clicked', () => {
    const onClose = jest.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Modal">
        Content
      </Modal>
    )
    fireEvent.click(screen.getByText('Content'))
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('TextInput Component', () => {
  it('renders input with label', () => {
    render(<TextInput label="Name" value="" onChange={() => {}} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
  })

  it('shows required asterisk when required prop is true', () => {
    render(<TextInput label="Email" required value="" onChange={() => {}} />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('calls onChange when input value changes', () => {
    const onChange = jest.fn()
    render(<TextInput value="test" onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new value' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('displays error message when error prop is provided', () => {
    render(<TextInput value="" onChange={() => {}} error="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('disables input when disabled prop is true', () => {
    render(<TextInput value="" onChange={() => {}} disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})

describe('TextArea Component', () => {
  it('renders textarea with label', () => {
    render(<TextArea label="Description" value="" onChange={() => {}} />)
    expect(screen.getByText('Description')).toBeInTheDocument()
  })

  it('displays character count when showCharCount is true', () => {
    render(<TextArea value="hello" onChange={() => {}} maxLength={100} showCharCount />)
    expect(screen.getByText('5 / 100')).toBeInTheDocument()
  })

  it('sets correct number of rows', () => {
    const { container } = render(<TextArea value="" onChange={() => {}} rows={10} />)
    expect(container.querySelector('textarea')).toHaveAttribute('rows', '10')
  })
})

describe('Select Component', () => {
  const options = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' }
  ]

  it('renders select with label', () => {
    render(<Select label="Choose" options={options} value="" onChange={() => {}} />)
    expect(screen.getByText('Choose')).toBeInTheDocument()
  })

  it('renders all options', () => {
    render(<Select options={options} value="" onChange={() => {}} />)
    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()
  })

  it('calls onChange when option is selected', () => {
    const onChange = jest.fn()
    render(<Select options={options} value="" onChange={onChange} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } })
    expect(onChange).toHaveBeenCalled()
  })
})

describe('Checkbox Component', () => {
  it('renders checkbox with label', () => {
    render(<Checkbox label="Agree" checked={false} onChange={() => {}} />)
    expect(screen.getByText('Agree')).toBeInTheDocument()
  })

  it('calls onChange when checked', () => {
    const onChange = jest.fn()
    render(<Checkbox label="Test" checked={false} onChange={onChange} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalled()
  })

  it('disables checkbox when disabled prop is true', () => {
    render(<Checkbox label="Disabled" checked={false} onChange={() => {}} disabled />)
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })
})

describe('Form Component', () => {
  it('renders form with children', () => {
    render(
      <Form onSubmit={() => {}}>
        <input type="text" placeholder="Name" />
      </Form>
    )
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument()
  })

  it('calls onSubmit when form is submitted', () => {
    const onSubmit = jest.fn()
    const { container } = render(
      <Form onSubmit={onSubmit}>
        <button type="submit">Submit</button>
      </Form>
    )
    fireEvent.submit(container.querySelector('form'))
    expect(onSubmit).toHaveBeenCalled()
  })
})
