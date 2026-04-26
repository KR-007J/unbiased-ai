import React from 'react'
import { vi, describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Button, Card, Badge, Spinner, Alert, Modal } from '../components/library'
import { TextInput, TextArea, Select, Checkbox, FileUpload, Form } from '../components/library/Forms'

describe('Button Component', () => {
  it('renders button with children', () => {
    render(<Button>Click Me</Button>)
    expect(screen.getByText('Click Me')).toBeInTheDocument()
  })

  it('calls onClick handler when clicked', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    fireEvent.click(screen.getByText('Click'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByText('Disabled')).toBeDisabled()
  })
})

describe('Card Component', () => {
  it('renders card with children', () => {
    render(<Card>Card Content</Card>)
    expect(screen.getByText('Card Content')).toBeInTheDocument()
  })

  it('calls onClick handler when interactive card is clicked', () => {
    const onClick = vi.fn()
    render(
      <Card interactive onClick={onClick}>
        Click Card
      </Card>
    )
    fireEvent.click(screen.getByText('Click Card'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('Alert Component', () => {
  it('renders alert with message', () => {
    const onClose = vi.fn()
    render(<Alert message="Test alert" onClose={onClose} />)
    expect(screen.getByText('Test alert')).toBeInTheDocument()
  })

  it('closes alert when close button is clicked', () => {
    const onClose = vi.fn()
    render(<Alert message="Alert" onClose={onClose} />)
    fireEvent.click(screen.getByText('×'))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('Modal Component', () => {
  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        Content
      </Modal>
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Modal">
        Content
      </Modal>
    )
    fireEvent.click(screen.getByText('×'))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('TextInput Component', () => {
  it('renders input with label', () => {
    render(<TextInput label="Name" value="" onChange={() => {}} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
  })

  it('calls onChange when input value changes', () => {
    const onChange = vi.fn()
    render(<TextInput value="test" onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new value' } })
    expect(onChange).toHaveBeenCalled()
  })
})

describe('Form Component', () => {
  it('calls onSubmit when form is submitted', () => {
    const onSubmit = vi.fn()
    const { container } = render(
      <Form onSubmit={onSubmit}>
        <button type="submit">Submit</button>
      </Form>
    )
    fireEvent.submit(container.querySelector('form'))
    expect(onSubmit).toHaveBeenCalled()
  })
})
