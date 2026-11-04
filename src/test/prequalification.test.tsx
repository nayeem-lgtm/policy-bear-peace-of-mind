import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PolicyWizard } from '@/components/policy-wizard'

vi.mock('@tanstack/react-router', () => ({
  useRouterState: () => '',
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => <a href={to} {...props}>{children}</a>,
}))

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function open(step: string, seed?: Record<string, string>) {
  if (seed) localStorage.setItem('policybear-demo', JSON.stringify({ answers: seed, screen: step, at: Date.now() }))
  window.history.replaceState(null, '', `/#step-${step}`)
  render(<PolicyWizard onStepChange={() => {}} />)
}

const contactAnswers = { firstName: 'Ann', lastName: 'Lee', email: 'ann@example.com', phone: '5555555555' }

function fillContact() {
  fireEvent.change(screen.getByRole('textbox', { name: 'First name' }), { target: { value: 'Ann' } })
  fireEvent.change(screen.getByRole('textbox', { name: 'Last name' }), { target: { value: 'Lee' } })
  fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), { target: { value: 'ann@example.com' } })
  fireEvent.change(screen.getByRole('textbox', { name: 'Mobile phone' }), { target: { value: '5555555555' } })
}

describe('Pre-qualification navigation', () => {
  it.each(['First name', 'Last name', 'Email', 'Mobile phone'])('requires %s on the contact page', (name) => {
    open('contact')
    expect(screen.getByRole('textbox', { name })).toBeRequired()
  })

  it('keeps Middle name optional', () => {
    open('contact')
    expect(screen.getByRole('textbox', { name: 'Middle name' })).not.toBeRequired()
  })

  it.each(['Me', 'My spouse or partner', 'My mom or dad', 'Someone else'])('automatically advances %s to contact details', (choice) => {
    open('who')
    fireEvent.click(screen.getByRole('radio', { name: new RegExp(`^${choice}`) }))
    act(() => { vi.advanceTimersByTime(350) })
    expect(window.location.hash).toBe('#step-contact')
    expect(screen.getByRole('textbox', { name: 'First name' })).toBeInTheDocument()
  })

  it('collects contact, verifies the phone and asks permission on one page', () => {
    open('contact')
    fillContact()
    act(() => { vi.advanceTimersByTime(1500) })
    expect(window.location.hash).toBe('#step-contact')
    fireEvent.click(screen.getByRole('button', { name: /Send code/ }))
    fireEvent.change(screen.getByRole('textbox', { name: '6-digit verification code' }), { target: { value: '123456' } })
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox'))
    act(() => { vi.advanceTimersByTime(1500) })
    expect(window.location.hash).toBe('#step-size')
  })

  it('requires the OTP before continuing without marketing permission', () => {
    open('contact', contactAnswers)
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Send code/ }))
    fireEvent.change(screen.getByRole('textbox', { name: '6-digit verification code' }), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(window.location.hash).toBe('#step-size')
  })

  it('advances automatically once permission is ticked', () => {
    open('contact', contactAnswers)
    fireEvent.click(screen.getByRole('button', { name: /Send code/ }))
    fireEvent.change(screen.getByRole('textbox', { name: '6-digit verification code' }), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('checkbox'))
    act(() => { vi.advanceTimersByTime(1500) })
    expect(window.location.hash).toBe('#step-size')
  })

  it('stays on contact details until verified or skipped, with no Continue button', () => {
    open('contact')
    expect(screen.queryByRole('button', { name: /Continue/ })).toBeNull()
    fillContact()
    act(() => { vi.advanceTimersByTime(1500) })
    expect(window.location.hash).toBe('#step-contact')
  })
  it('returns from address to height and weight', () => {
    open('address')
    fireEvent.click(screen.getByRole('button', { name: 'Go back to the previous question' }))
    expect(window.location.hash).toBe('#step-size')
  })
  it('completes height and weight before automatically moving to address', () => {
    open('size')
    fireEvent.change(screen.getByRole('combobox', { name: 'Feet' }), { target: { value: '5' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Inches' }), { target: { value: '0' } })
    act(() => { vi.advanceTimersByTime(1500) })
    expect(window.location.hash).toBe('#step-size')
    fireEvent.change(screen.getByRole('textbox', { name: 'Weight (lbs)' }), { target: { value: '160' } })
    act(() => { vi.advanceTimersByTime(1500) })
    expect(window.location.hash).toBe('#step-address')
    fireEvent.click(screen.getByRole('button', { name: /Go back/ }))
    expect(screen.getByRole('combobox', { name: 'Feet' })).toHaveValue('5')
    expect(screen.getByRole('combobox', { name: 'Inches' })).toHaveValue('0')
    expect(screen.getByRole('textbox', { name: 'Weight (lbs)' })).toHaveValue('160')
    act(() => { vi.advanceTimersByTime(1500) })
    expect(window.location.hash).toBe('#step-size')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(window.location.hash).toBe('#step-address')
  })
  it('preserves address answers when navigating Back', () => {
    open('address')
    fireEvent.change(screen.getByRole('combobox', { name: 'Street address' }), { target: { value: '125 Main Street' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'City' }), { target: { value: 'Dallas' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'State' }), { target: { value: 'Texas' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'ZIP code' }), { target: { value: '75201' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(window.location.hash).toBe('#step-identity')
    fireEvent.click(screen.getByRole('button', { name: 'Go back to the previous question' }))
    expect(screen.getByRole('combobox', { name: 'Street address' })).toHaveValue('125 Main Street')
    expect(screen.getByRole('textbox', { name: 'City' })).toHaveValue('Dallas')
  })
})
describe('Revisiting a step', () => {
  it('shows a small Next button after going Back, with no auto-advance', () => {
    open('size')
    fireEvent.click(screen.getByRole('button', { name: /Go back/ }))
    expect(window.location.hash).toBe('#step-contact')
    fillContact()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: /Send code/ }))
    fireEvent.change(screen.getByRole('textbox', { name: '6-digit verification code' }), { target: { value: '123456' } })
    act(() => { vi.advanceTimersByTime(2000) })
    expect(window.location.hash).toBe('#step-contact')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(window.location.hash).toBe('#step-size')
  })
})

describe('Identity split', () => {
  it('auto-advances identity to the separate SSN and owner step', () => {
    open('identity')
    fireEvent.change(screen.getByRole('combobox', { name: 'Country of birth' }), { target: { value: 'Canada' } })
    fireEvent.click(screen.getByRole('radio', { name: /^Yes$/ }))
    act(() => { vi.advanceTimersByTime(800) })
    expect(window.location.hash).toBe('#step-ssn')
    expect(screen.getByText('Will you be the policy owner and the person paying?')).toBeInTheDocument()
  })
})

describe('Application auto-advance', () => {
  it('moves on from other insurance when No is chosen', () => {
    open('insurance')
    fireEvent.click(screen.getByRole('radio', { name: /^No/ }))
    act(() => { vi.advanceTimersByTime(400) })
    expect(window.location.hash).toBe('#step-payment')
  })
  it('moves on from draft date with one tap', () => {
    open('draft')
    fireEvent.click(screen.getByRole('radio', { name: /^1st of the month/ }))
    act(() => { vi.advanceTimersByTime(400) })
    expect(window.location.hash).toBe('#step-review')
  })
  it('stays on beneficiary when A person is chosen so details can be entered', () => {
    open('beneficiary')
    fireEvent.click(screen.getByRole('radio', { name: /^A person/ }))
    act(() => { vi.advanceTimersByTime(400) })
    expect(window.location.hash).toBe('#step-beneficiary')
    expect(screen.getByRole('textbox', { name: 'First name' })).toBeInTheDocument()
  })
  it('holds the beneficiary step until the person’s name and relationship are given', () => {
    open('beneficiary')
    fireEvent.click(screen.getByRole('button', { name: /^Next/ }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(window.location.hash).toBe('#step-beneficiary')
    fireEvent.change(screen.getByRole('textbox', { name: 'First name' }), { target: { value: 'Jane' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Last name' }), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Relationship' }), { target: { value: 'Daughter' } })
    fireEvent.click(screen.getByRole('button', { name: /^Next/ }))
    expect(window.location.hash).toBe('#step-insurance')
  })
})
