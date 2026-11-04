import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { AlertCircle, ArrowLeft, Check, ChevronDown, Clock, Cigarette, CreditCard, Eye, EyeOff, Fingerprint, Heart, HeartPulse, Landmark, LockKeyhole, MapPin, Mars, Minus, Moon, PartyPopper, PenLine, Phone, Smartphone, Plus, RotateCcw, Ruler, Scale, ShieldCheck, Sparkles, Sun, Sunrise, UserRound, Users, Venus, X } from 'lucide-react'
import * as Radio from '@radix-ui/react-radio-group'
import * as Checkbox from '@radix-ui/react-checkbox'
import { z } from 'zod'
import { Link, useRouterState } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { AddressAutocomplete } from '@/components/address-autocomplete'
import { SignatureFlow, type PinDelivery } from '@/components/signature-flow'
import bearLogo from '@/assets/policybear-logo.asset.json'
import { cardBrand, expiryValid, formatCard, formatExpiry, lookupRouting, luhnValid } from '@/lib/payment-lookup'
import bearGuide from '@/assets/bear-guide-full.png'
import geotrustSeal from '@/assets/geotrust-seal.png.asset.json'
import trusteSeal from '@/assets/truste-seal.png.asset.json'
import trustlockSeal from '@/assets/trustlock-seal.png.asset.json'

const bearTips: Partial<Record<string, { myth: string; fact: string }>> = {
  gender: { myth: 'Life insurance is too expensive', fact: '50% of people overestimate the cost of life insurance' },
  dob: { myth: 'Applying for life insurance is a hassle', fact: 'Applying for life insurance is fast and easy' },
  coverage: { myth: 'The group life insurance I get at work is enough', fact: 'Group life insurance may not cover your family’s needs' },
  tobacco: { myth: 'I don’t have dependents so I don’t need life insurance', fact: 'Life insurance will pay off student loans or mortgages in the event of your death' },
}

import { COVERAGE_MAX, COVERAGE_MIN, LICENSED_STATES, calculatePrice, chapterFor, chapterProgress, coverageFromPrices, determineOutcome, formatSSN, healthQuestions, journeySteps, quoteSteps, sanitizedAnswers, US_STATES, type JourneyStep, type Outcome } from '@/lib/final-expense-demo'

type Answers = {
  zip: string; city: string; state: string; who: string; month: string; day: string; year: string
  gender: string; tobacco: string; feet: string; inches: string; weight: string; coverage: string
  firstName: string; middleName: string; lastName: string; email: string; phone: string
  street: string; apt: string; country: string; birthState: string; citizen: string; resident: string
  owner: string; ssn: string; beneficiaryType: string; beneficiaryFirst: string; beneficiaryLast: string
  relationship: string; beneficiaryPhone: string; beneficiaryKnowPhone: string; beneficiaryKnowAddress: string; beneficiaryAddress: string; otherInsurance: string; replacing: string
  paymentMethod: string; accountName: string; accountType: string; routing: string; account: string
  accountConfirm: string; card: string; expiry: string; paymentZip: string; draftDate: string
  signature: string; callbackTime: string; coverageType: string; health: string[]
}
type StringAnswerKey = Exclude<keyof Answers, 'health'>
const blank: Answers = { zip: '', city: '', state: '', who: '', month: '', day: '', year: '', gender: '', tobacco: '', feet: '', inches: '', weight: '', coverage: '15000', firstName: '', middleName: '', lastName: '', email: '', phone: '', street: '', apt: '', country: 'United States', birthState: '', citizen: '', resident: '', owner: '', ssn: '', beneficiaryType: 'A person', beneficiaryFirst: '', beneficiaryLast: '', relationship: '', beneficiaryPhone: '', beneficiaryKnowPhone: '', beneficiaryKnowAddress: '', beneficiaryAddress: '', otherInsurance: '', replacing: '', paymentMethod: 'EFT', accountName: '', accountType: 'Checking', routing: '', account: '', accountConfirm: '', card: '', expiry: '', paymentZip: '', draftDate: '1st of the month', signature: '', callbackTime: '', coverageType: '', health: Array(8).fill('') }
const labels = ['Your Profile', 'Pre-Qualification', 'Application', 'Finalize']
const phone = '[FE_PHONE]'
// Mars + Venus pair for the sex question: brand blue for Mars, gold for Venus.
const SexBadgeIcon = () => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><g className="sex-mark-mars"><circle cx="7.5" cy="8.5" r="4" /><path d="M10.33 5.67 13.2 2.8M13.2 2.8h-2.6M13.2 2.8v2.6" /></g><g className="sex-mark-venus"><circle cx="16.5" cy="14" r="4" /><path d="M16.5 18v3.5M14.3 20.1h4.4" /></g></svg>
const DateBadgeIcon = () => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><g className="date-frame"><rect x="3.2" y="5.2" width="17.6" height="15.6" rx="3.4" /><path d="M8 3.2v4M16 3.2v4M3.2 10.1h17.6" /></g><g className="date-mark"><circle cx="8.9" cy="14.1" r="1.15" /><circle cx="12" cy="13.2" r="1.2" /><circle cx="15.1" cy="14.1" r="1.15" /><ellipse cx="12" cy="17.7" rx="2.7" ry="2" /></g></svg>
const PawGlyph = () => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><ellipse cx="5.6" cy="11.2" rx="2.1" ry="2.7" transform="rotate(-20 5.6 11.2)" /><ellipse cx="9.7" cy="7.4" rx="2.1" ry="2.8" transform="rotate(-7 9.7 7.4)" /><ellipse cx="14.3" cy="7.4" rx="2.1" ry="2.8" transform="rotate(7 14.3 7.4)" /><ellipse cx="18.4" cy="11.2" rx="2.1" ry="2.7" transform="rotate(20 18.4 11.2)" /><path d="M12 12.4c3.3 0 6 2.2 6 4.7 0 2.4-2.3 3.7-4.4 2.9-1-.4-2.2-.4-3.2 0-2.1.8-4.4-.5-4.4-2.9 0-2.5 2.7-4.7 6-4.7Z" /></svg>
// Coverage icons: hand-drawn coins that grow with the amount — brand blue strokes, gold accents.
const PawPrint = ({ x, y, s }: { x: number; y: number; s: number }) => <g transform={`translate(${x} ${y}) scale(${s})`}><ellipse cx="5.6" cy="11.2" rx="2.1" ry="2.7" transform="rotate(-20 5.6 11.2)" /><ellipse cx="9.7" cy="7.4" rx="2.1" ry="2.8" transform="rotate(-7 9.7 7.4)" /><ellipse cx="14.3" cy="7.4" rx="2.1" ry="2.8" transform="rotate(7 14.3 7.4)" /><ellipse cx="18.4" cy="11.2" rx="2.1" ry="2.7" transform="rotate(20 18.4 11.2)" /><path d="M12 12.4c3.3 0 6 2.2 6 4.7 0 2.4-2.3 3.7-4.4 2.9-1-.4-2.2-.4-3.2 0-2.1.8-4.4-.5-4.4-2.9 0-2.5 2.7-4.7 6-4.7Z" /></g>
const SHIELD = 'M12 2.4 19.6 5v6.2c0 4.7-3.2 7.9-7.6 9.6-4.4-1.7-7.6-4.9-7.6-9.6V5Z'
// Coverage amounts read as a protection shield filling up: more coverage, more of the shield filled with gold.
const CoverageShieldIcon = ({ fill = 0.5, sparkle = false }: { fill?: number; sparkle?: boolean }) => {
  const id = useId().replace(/:/g, '')
  const top = 20.8 - 18.4 * fill
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><defs><clipPath id={`sh${id}`}><path d={SHIELD} /></clipPath></defs><rect className="cov-fill" fill="var(--brand-action)" x="1" y={top} width="22" height={21.6 - top} stroke="none" clipPath={`url(#sh${id})`} /><path d={SHIELD} />{sparkle && <path className="cov-mark" fill="var(--brand-action)" d="M21.2 1l.5 1.1 1.1.5-1.1.5-.5 1.1-.5-1.1-1.1-.5 1.1-.5Z" />}</svg>
}
const CoverageBadgeIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={SHIELD} /><g fill="var(--brand-action)" stroke="none"><PawPrint x={5.8} y={5.2} s={0.52} /></g></svg>
const coverageOptions = [
  { value: '10000', icon: <CoverageShieldIcon fill={0.3} />, from: coverageFromPrices['10000'] },
  { value: '15000', icon: <CoverageShieldIcon fill={0.5} />, popular: true, from: coverageFromPrices['15000'] },
  { value: '20000', icon: <CoverageShieldIcon fill={0.7} />, from: coverageFromPrices['20000'] },
  { value: '25000', icon: <CoverageShieldIcon fill={0.88} sparkle />, from: coverageFromPrices['25000'] },
]
const RecipientIcon = ({ kind = 'family' }: { kind?: 'self' | 'partner' | 'parent' | 'other' | 'family' }) => <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind === 'self' ? <><circle cx="16" cy="10" r="4" /><path d="M7 26v-3a9 9 0 0 1 18 0v3" /></> : <><circle cx="10" cy="10" r="3.7" /><circle cx="23" cy={kind === 'parent' ? '8' : '10'} r="3.7" /><path d="M3 26v-3a7 7 0 0 1 13-3M18 20a7 7 0 0 1 12 3v3" />{kind === 'parent' && <path d="M21 6h4M21 10h4" />}</>}{kind === 'other' ? <path className="recipient-gold" d="M17 25h7M20.5 21.5v7" /> : <path className="recipient-gold" d="M16 28s-5-3-5-6a2.8 2.8 0 0 1 5-1.6A2.8 2.8 0 0 1 21 22c0 3-5 6-5 6Z" />}</svg>
const whoIcons: Record<string, React.ReactNode> = { Me: <RecipientIcon kind="self" />, 'My spouse or partner': <RecipientIcon kind="partner" />, 'My mom or dad': <RecipientIcon kind="parent" />, 'Someone else': <RecipientIcon kind="other" /> }
const callbackIcons: Record<string, React.ReactNode> = { Morning: <Sunrise />, Afternoon: <Sun />, Evening: <Moon /> }

export function PolicyWizard({ onStepChange }: { onStepChange: (step: number) => void }) {
  const routeHash = useRouterState({ select: (state) => state.location.hash })
  const [screen, setScreen] = useState<JourneyStep>('state')
  const [answers, setAnswers] = useState<Answers>(blank)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [resume, setResume] = useState(false)
  const [demo, setDemo] = useState(false)
  const [forced, setForced] = useState<Outcome | ''>('')
  const [annual, setAnnual] = useState(false)
  const [editingCoverage, setEditingCoverage] = useState(false)
  const [otherAmount, setOtherAmount] = useState(false)
  const customTimer = useRef(0)
  const advanceTimer = useRef(0)
  const [showSSN, setShowSSN] = useState(false)
  const [consent, setConsent] = useState(false)
  const [documents, setDocuments] = useState(false)
  const [pinDelivery, setPinDelivery] = useState<PinDelivery>('')
  const [signed, setSigned] = useState(false)
  const [signatureMode, setSignatureMode] = useState<'type' | 'draw'>('type')
  const [signatureStyle, setSignatureStyle] = useState(0)
  const [hasDrawing, setHasDrawing] = useState(false)
  const [code, setCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const phoneVerified = otp.length === 6
  const [loadingLine, setLoadingLine] = useState(0)
  const [policyNumber, setPolicyNumber] = useState('')
  const [paymentSavedAt, setPaymentSavedAt] = useState<Date | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const screenIndex = journeySteps.indexOf(screen)
  const quoteIndex = quoteSteps.findIndex((step) => step === screen)
  const age = useMemo(() => {
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(answers.month)
    if (!answers.year || !answers.day || monthIndex < 0) return Number.NaN
    const birthday = new Date(Number(answers.year), monthIndex, Number(answers.day))
    if (birthday.getFullYear() !== Number(answers.year) || birthday.getMonth() !== monthIndex || birthday.getDate() !== Number(answers.day)) return Number.NaN
    const today = new Date()
    return today.getFullYear() - birthday.getFullYear() - (today < new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate()) ? 1 : 0)
  }, [answers.day, answers.month, answers.year])
  const coverage = Number(answers.coverage) || 15000
  const naturalOutcome = determineOutcome(answers.health)
  const outcome = forced || naturalOutcome
  const coverageType = screen === 'gi-offer' || answers.coverageType === 'Guaranteed Issue' ? 'guaranteed' : outcome === 'graded' ? 'graded' : 'immediate'
  const monthly = calculatePrice(age || 68, answers.gender || 'Female', coverage, answers.tobacco, coverageType)
  const shownPrice = annual ? monthly * 12 * .95 : monthly

  useEffect(() => {
    let savedStep: JourneyStep | undefined
    try {
      const saved = JSON.parse(localStorage.getItem('policybear-demo') || 'null')
      if (saved?.answers && Date.now() - saved.at < 7 * 86400000) {
        const restored = { ...blank, ...(saved.answers as Partial<Answers>), paymentMethod: (saved.answers as Partial<Answers>).paymentMethod === 'Debit or credit card' ? 'Debit or credit card' : 'EFT', ssn: '', routing: '', account: '', accountConfirm: '', card: '', expiry: '', paymentZip: '', health:blank.health.map((value, index) => Array.isArray(saved.answers.health) ? saved.answers.health[index] || value : value) }
        setAnswers(restored)
        localStorage.setItem('policybear-demo', JSON.stringify({ answers: sanitizedAnswers(restored), screen: saved.screen, at: Date.now() }))
        if (saved.screen === 'personal') savedStep = 'address'
        else if (saved.screen === 'review') savedStep = 'disclosures'
        else if (journeySteps.includes(saved.screen)) savedStep = saved.screen
        setResume(true)
      }
    } catch { /* Browsing privacy settings should not block the demo. */ }
    const fromHash = location.hash.replace('#step-', '').replace(/^personal$/, 'address').replace(/^review$/, 'disclosures') as JourneyStep
    if (journeySteps.includes(fromHash)) setScreen(fromHash)
    else if (savedStep) setScreen(savedStep)
    setReady(true)
    const hashChange = () => { const next = location.hash.replace('#step-', '').replace(/^personal$/, 'address').replace(/^review$/, 'disclosures') as JourneyStep; if (journeySteps.includes(next)) setScreen(next) }
    window.addEventListener('hashchange', hashChange)
    return () => window.removeEventListener('hashchange', hashChange)
  }, [])

  useEffect(() => {
    const next = routeHash.replace(/^#?step-/, '').replace(/^personal$/, 'address').replace(/^review$/, 'disclosures') as JourneyStep
    if (!journeySteps.includes(next)) return
    setScreen(next)
    setError('')
    setResume(false)
    if (next === 'state') window.scrollTo({ top: 0, behavior: 'instant' })
  }, [routeHash])

  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem('policybear-demo', JSON.stringify({ answers: sanitizedAnswers(answers), screen, at: Date.now() })) } catch { /* Continue without persistence. */ }
    onStepChange(screen === 'state' ? 0 : 1)
  }, [answers, onStepChange, ready, screen])

  useEffect(() => {
    if (!ready) return
    heading.current?.focus({ preventScroll: true })
    if (screen === 'state') return
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
      })
    })
    return () => { cancelAnimationFrame(first); if (second) cancelAnimationFrame(second) }
  }, [ready, screen])

  useEffect(() => {
    if (!['loading', 'underwriting', 'submitting'].includes(screen)) return
    setLoadingLine(0)
    const first = window.setTimeout(() => setLoadingLine(1), 650)
    const second = window.setTimeout(() => setLoadingLine(2), 1300)
    const finish = window.setTimeout(() => {
      if (screen === 'loading') go('price')
      if (screen === 'underwriting') go('decision')
      if (screen === 'submitting') { setPolicyNumber(`PB-FE-${Math.floor(100000 + Math.random() * 900000)}`); go('issued') }
    }, screen === 'underwriting' ? 3200 : 2200)
    return () => { clearTimeout(first); clearTimeout(second); clearTimeout(finish) }
  }, [screen, outcome])

  const update = (key: StringAnswerKey, value: string) => { setAnswers((current) => ({ ...current, [key]: value })); setError('') }
  const go = (next: JourneyStep) => { window.clearTimeout(advanceTimer.current); window.clearTimeout(customTimer.current); setError(''); setResume(false); location.hash = `step-${next}`; setScreen(next) }
  const advance = (next: JourneyStep) => { window.clearTimeout(advanceTimer.current); advanceTimer.current = window.setTimeout(() => go(next), 300) }
  useEffect(() => () => { window.clearTimeout(advanceTimer.current); window.clearTimeout(customTimer.current) }, [])
  const [furthest, setFurthest] = useState(0)
  const identityTouched = useRef(false)
  const [identitySelection, setIdentitySelection] = useState(0)
  const chooseIdentity = (key: 'country' | 'birthState' | 'citizen' | 'resident', value: string) => { identityTouched.current = true; update(key, value); setIdentitySelection((count) => count + 1) }
  useEffect(() => { setFurthest((value) => Math.max(value, journeySteps.indexOf(screen))) }, [screen])
  const revisiting = journeySteps.indexOf(screen) < furthest
  const nextLink = (next: JourneyStep, ready = true) => revisiting ? <button type="button" className="revisit-next" disabled={!ready} onClick={() => go(next)}>Next</button> : null
  const contactReady = Boolean(answers.firstName.trim() && answers.lastName.trim() && z.string().email().safeParse(answers.email).success && answers.phone.replace(/\D/g, '').length >= 10 && phoneVerified)
  const identityReady = Boolean(answers.country && (answers.country !== 'United States' || answers.birthState) && (answers.citizen === 'Yes — U.S. citizen' || (answers.citizen === 'No' && answers.resident === 'Yes — resident over 2 years')))
  const sizeReady = Boolean(answers.feet && answers.inches && z.coerce.number().min(80).max(500).safeParse(answers.weight).success)
  const ssnProtected = answers.ssn.replace(/\D/g, '').length === 9
  useEffect(() => {
    const next = screen === 'contact' && contactReady && consent ? 'size' : screen === 'size' && sizeReady ? 'address' : null
    if (!next || revisiting) return
    const timer = window.setTimeout(() => go(next), screen === 'contact' || screen === 'size' ? 1400 : 700)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, contactReady, sizeReady, consent, phoneVerified, revisiting, identityReady, answers.firstName, answers.lastName, answers.email, answers.phone, answers.weight])
  useEffect(() => {
    if (screen !== 'identity') { identityTouched.current = false; return }
    if (!identityTouched.current) return
    const next = identityReady ? 'ssn' : answers.citizen === 'No' && answers.resident === 'No — neither' ? 'ineligible' : null
    if (!next) return
    const timer = window.setTimeout(() => go(next), 300)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, identityReady, identitySelection, answers.citizen, answers.resident])
  const back = () => { let i = screenIndex - 1; const skipped = ['loading', 'underwriting', 'submitting', ...(outcome !== 'declined' ? ['eligibility', 'gi-offer'] : [])]; while (i > 0 && skipped.includes(journeySteps[i] ?? '')) i -= 1; const previous = journeySteps[Math.max(0, i)]; if (previous) go(previous) }
  const choose = (key: StringAnswerKey, value: string, next?: JourneyStep) => { update(key, value); if (next) advance(next) }
  // Custom coverage advances on its own once the slider settles, so no Continue button is needed.
  const settleCustom = (value: string) => {
    update('coverage', value)
    window.clearTimeout(customTimer.current)
    customTimer.current = window.setTimeout(() => { customTimer.current = 0; advance('loading') }, 700)
  }
  const clearCustomTimer = () => { window.clearTimeout(customTimer.current); customTimer.current = 0 }
  const healthChoice = (index: number, value: string) => {
    const health = answers.health.map((answer, i) => i === index ? value : answer)
    setAnswers((current) => ({ ...current, health }))
    advance(index === 7 ? ((forced || determineOutcome(health)) === 'declined' ? 'eligibility' : 'beneficiary') : (`h${index + 2}` as JourneyStep))
  }
  const dobTouched = useRef(false)
  const validDOBNow = age >= 50 && age <= 85 && Boolean(answers.day && answers.month && answers.year)
  useEffect(() => {
    if (screen !== 'dob') { dobTouched.current = false; return }
    if (!dobTouched.current || !validDOBNow) return
    const timer = window.setTimeout(() => go('tobacco'), 600)
    return () => clearTimeout(timer)
  }, [screen, validDOBNow, answers.day, answers.month, answers.year])
  const validDOB = age >= 50 && age <= 85 && Boolean(answers.day && answers.month && answers.year)
  const field = (key: StringAnswerKey, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => {
    const numeric = ['zip', 'weight', 'routing', 'account', 'accountConfirm', 'card', 'paymentZip'].includes(key)
    const telephone = ['phone', 'beneficiaryPhone'].includes(key)
    const autofill: Partial<Record<StringAnswerKey, string>> = { firstName: 'given-name', middleName: 'additional-name', lastName: 'family-name', email: 'email', phone: 'tel', zip: 'postal-code', signature: 'name' }
    return <label className="field-label">{label}<input className="text-field" name={key} inputMode={numeric ? 'numeric' : telephone ? 'tel' : undefined} autoComplete={autofill[key] || 'off'} enterKeyHint="next" value={answers[key]} onChange={(event) => update(key, event.target.value)} maxLength={100} {...props} /></label>
  }
  const tile = (key: StringAnswerKey, label: string, optional = false, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => {
    const autofill: Partial<Record<StringAnswerKey, string>> = { firstName: 'given-name', middleName: 'additional-name', lastName: 'family-name', email: 'email' }
    return <label className={`contact-tile${answers[key] ? ' is-filled' : ''}`}><span className="contact-tile-label">{label}{!optional && <span className="contact-required" aria-hidden="true"> *</span>}</span><input name={key} aria-label={label} required={!optional} autoComplete={autofill[key] || 'off'} value={answers[key]} onChange={(event) => update(key, event.target.value)} maxLength={100} {...props} /></label>
  }
  const select = (key: StringAnswerKey, label: string, options: string[], disabled = false, placeholder = label) => <label className="field-label">{label}<select value={answers[key]} disabled={disabled} onChange={(event) => { if (screen === 'dob') dobTouched.current = true; update(key, event.target.value) }}><option value="">{placeholder}</option>{options.map((option) => <option key={option}>{option}</option>)}</select></label>
  const dobSelect = (key: StringAnswerKey, label: string, options: string[]) => <label className="date-seg" data-filled={answers[key] ? '' : undefined}><span className="date-seg-label">{label}</span><select aria-label={label} value={answers[key]} onChange={(event) => { dobTouched.current = true; update(key, event.target.value) }}><option value="">–</option>{options.map((option) => <option key={option}>{option}</option>)}</select></label>
  const cards = (key: StringAnswerKey, options: string[], next?: JourneyStep | ((option: string) => JourneyStep | undefined), icons?: Record<string, React.ReactNode>, layout: 'stack' | 'pair' = 'stack', descriptions?: Record<string, string>, extraClass = '') => <Radio.Root aria-label={key} value={answers[key]} onValueChange={(value) => update(key, value)} className={`answer-list${layout === 'pair' ? ' answer-list-pair' : ''}${extraClass ? ` ${extraClass}` : ''}`}>{options.map((option) => <Radio.Item className="answer-card" key={option} value={option} onClick={() => choose(key, option, typeof next === 'function' ? next(option) : next)}><span className="answer-copy">{icons?.[option] && <span className="answer-badge" aria-hidden="true">{icons[option]}</span>}{descriptions?.[option] ? <span className="answer-text"><strong>{option}</strong><span>{descriptions[option]}</span></span> : <strong>{option}</strong>}</span></Radio.Item>)}</Radio.Root>
  const submitNext = (next: JourneyStep, valid = true, message = 'Please complete the required fields.') => (event: React.FormEvent) => { event.preventDefault(); if (!valid) { setError(message); return } go(next) }
  const continueTo = (next: JourneyStep, label = 'Continue') => <Button type="button" variant="quiet" className="continue-optional" onClick={() => go(next)}>{label}</Button>
  const trust = null

  const shell = (title: string, helper: string, content: React.ReactNode, options?: { back?: boolean; compact?: boolean; icon?: React.ReactNode }) => <>
    <div className={`wizard-content ${options?.compact ? 'compact-content' : ''}`} key={screen}>
      {options?.icon
        ? <div className="question-head"><span className="question-badge" aria-hidden="true">{options.icon}</span><div className="question-head-copy"><h2 id="wizard-title" ref={heading} tabIndex={-1}>{title}</h2>{helper && <p className="question-helper">{helper}</p>}</div></div>
        : <><h2 id="wizard-title" ref={heading} tabIndex={-1}>{title}</h2>{helper && <p className="question-helper">{helper}</p>}</>}
      {content}
      {error && <div className="form-error" role="alert"><AlertCircle /> {error}</div>}
    </div>
  </>

  function renderScreen() {
    if (screen === 'state') return shell('What state do you currently reside in?', 'Plans, prices and eligibility depend on where you live.', <form onSubmit={submitNext('gender', Boolean(answers.state), 'Please choose your state of residence.')}>
      <label className="field-label">State of residence
        <div className="state-select">
          <MapPin aria-hidden="true" />
          <select aria-label="State of residence" style={{ color: answers.state ? undefined : 'var(--muted-foreground)' }} value={answers.state} onChange={(event) => update('state', event.target.value)}>
            <option value="">Select your state</option>
            {LICENSED_STATES.map((item) => <option key={item.abbr} value={item.name}>{item.name} ({item.abbr})</option>)}
          </select>
          <ChevronDown aria-hidden="true" className="state-caret" />
        </div>
      </label>
      <Button variant="action" size="touch" className="continue-button reveal-button">Get my instant quote</Button>
    </form>, { back: false })
    if (screen === 'who') return shell('Who are we helping protect?', '', <><Radio.Root aria-label="Who coverage protects" value={answers.who} onValueChange={(value) => choose('who', value, 'contact')} className="recipient-choices">{['Me', 'My spouse or partner', 'My mom or dad', 'Someone else'].map((option) => <Radio.Item className="recipient-choice" key={option} value={option} onClick={() => { if (answers.who === option) advance('contact') }}><span className="recipient-icon" aria-hidden="true">{whoIcons[option]}</span><span className="recipient-copy"><strong>{option}</strong></span></Radio.Item>)}</Radio.Root></>, { icon: <RecipientIcon /> })
    if (screen === 'dob') return shell("What's your date of birth?", '', <form onSubmit={submitNext('tobacco', validDOB, 'Please enter a valid date for someone age 50 to 85.')}><div className="date-fields">{dobSelect('month', 'Month', Array.from({ length: 12 }, (_, i) => new Date(2026, i).toLocaleString('en', { month: 'short' })))}{dobSelect('day', 'Day', Array.from({ length: 31 }, (_, i) => String(i + 1)))}{dobSelect('year', 'Year', Array.from({ length: 36 }, (_, i) => String(new Date().getFullYear() - 50 - i)))}</div>{answers.month && answers.day && answers.year && <p className="date-age"><Check /> You’re {age}</p>}{trust}</form>, { icon: <DateBadgeIcon /> })
    if (screen === 'gender') return shell('What is your sex assigned at birth?', '', <div className="sex-choices">{cards('gender', ['Male', 'Female'], 'dob', { Male: <Mars />, Female: <Venus /> }, 'pair')}</div>, { icon: <SexBadgeIcon /> })
    if (screen === 'tobacco') return shell('Have you used tobacco or nicotine in the last 12 months?', '', <><div className="tobacco-choices">{cards('tobacco', ['Yes', 'No'], 'coverage', { Yes: <Cigarette />, No: <X /> }, 'pair')}</div><p className="valid-note"><ShieldCheck /> Smokers can still get covered.</p></>, { icon: <Cigarette /> })
    if (screen === 'size') return shell("What's your height and weight?", '', <form className="centered-step size-step" onSubmit={submitNext('address', sizeReady)}><div className="measurement-fields">{(['feet', 'inches'] as const).map((key) => <label key={key} className={`contact-tile measurement-tile${answers[key] ? ' is-filled' : ''}`}><span className="contact-tile-label"><Ruler aria-hidden="true" />{key === 'feet' ? 'Feet' : 'Inches'}</span><span className="measurement-select"><select aria-label={key === 'feet' ? 'Feet' : 'Inches'} required value={answers[key]} onChange={(event) => update(key, event.target.value)}><option value="">–</option>{(key === 'feet' ? ['4', '5', '6', '7'] : Array.from({ length: 12 }, (_, i) => String(i))).map((value) => <option key={value} value={value}>{value}</option>)}</select><ChevronDown aria-hidden="true" /></span></label>)}<label className={`contact-tile measurement-tile${answers.weight ? ' is-filled' : ''}`}><span className="contact-tile-label"><Scale aria-hidden="true" />Weight (lbs)</span><input name="weight" aria-label="Weight (lbs)" required inputMode="numeric" maxLength={3} placeholder="–" value={answers.weight} onChange={(event) => update('weight', event.target.value)} /></label></div>{revisiting && <div className="next-row"><Button type="submit" variant="action" className="revisit-next" disabled={!sizeReady}>Next</Button></div>}</form>, { icon: <Ruler /> })
    if (screen === 'coverage') return shell('How much coverage would you like?', '', <form onSubmit={submitNext('loading')}><Radio.Root value={answers.coverage} onValueChange={(value) => update('coverage', value)} className="coverage-grid">{coverageOptions.map((option) => <Radio.Item className="coverage-card" value={option.value} key={option.value} onClick={() => { clearCustomTimer(); setOtherAmount(false); choose('coverage', option.value, 'loading') }}>{option.popular && <span className="coverage-tag">Most popular</span>}<span className="coverage-icon" aria-hidden="true">{option.icon}</span><span className="coverage-copy"><strong>${Number(option.value).toLocaleString()}</strong></span><span className="coverage-price">From ${option.from}/mo</span></Radio.Item>)}</Radio.Root><Button variant="quiet" className="other-amount" type="button" onClick={() => { clearCustomTimer(); setOtherAmount(!otherAmount) }}>{otherAmount ? 'Choose a suggested amount' : 'Choose a different amount'}</Button>{otherAmount && <div className="coverage-custom"><span className="coverage-custom-label">Your amount</span><strong>${coverage.toLocaleString()}</strong><div className="coverage-slider"><Button type="button" variant="quiet" aria-label="Decrease coverage" onClick={() => settleCustom(String(Math.max(COVERAGE_MIN, coverage - 1000)))}><Minus /></Button><input type="range" min="5000" max={COVERAGE_MAX} step="1000" value={coverage} onChange={(event) => settleCustom(event.target.value)} /><Button type="button" variant="quiet" aria-label="Increase coverage" onClick={() => settleCustom(String(Math.min(COVERAGE_MAX, coverage + 1000)))}><Plus /></Button></div><span className="coverage-custom-range">${COVERAGE_MIN.toLocaleString()} – ${COVERAGE_MAX.toLocaleString()} available</span></div>}{trust}</form>, { icon: <CoverageBadgeIcon /> })
    if (screen === 'contact') return shell('Let’s get to know you', answers.who && answers.who !== 'Me' ? 'Please enter the details of the person being covered. They’ll need to answer and sign themselves.' : '', <form className="centered-step contact-step" onSubmit={submitNext('size', contactReady)}><div className="contact-tiles three">{tile('firstName', 'First name')}{tile('middleName', 'Middle name', true)}{tile('lastName', 'Last name')}</div><div className="contact-tiles two">{tile('email', 'Email', false, { type: 'email' })}<label className={`contact-tile phone-tile${answers.phone ? ' is-filled' : ''}${phoneVerified ? ' is-verified' : ''}`}><span className="contact-tile-label">Mobile phone<span className="contact-required" aria-hidden="true"> *</span></span><span className="phone-row"><input name="phone" aria-label="Mobile phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="(555) 555-5555" value={answers.phone} maxLength={20} onChange={(event) => { update('phone', event.target.value); setOtp(''); setOtpSent(false) }} />{phoneVerified && <span className="verified-chip"><Check aria-hidden="true" /> Verified</span>}</span></label></div>{!phoneVerified && <div className="otp-panel"><p className="otp-panel-heading"><Smartphone aria-hidden="true" /> Verify your mobile number</p>{!otpSent ? <><p className="otp-panel-title">We’ll text a 6-digit code to {answers.phone || 'your mobile number'}.</p><button type="button" className="send-code-btn" disabled={answers.phone.replace(/\D/g, '').length < 10} onClick={() => { setOtpSent(true); setOtp('') }}>Send code</button></> : <><p className="otp-panel-title">Enter the code sent to {answers.phone}</p><div className="otp-cells" onClick={() => document.getElementById('otp-input')?.focus()}><input id="otp-input" className="otp-hidden-input" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} aria-label="6-digit verification code" autoFocus />{Array.from({ length: 6 }, (_, i) => <span key={i} className={`otp-cell${otp[i] ? ' is-filled' : ''}${otp.length === i ? ' is-active' : ''}`} aria-hidden="true">{otp[i] ?? ''}</span>)}</div><button type="button" className="skip-link" onClick={() => setOtp('')}>Resend code</button></>}</div>}{phoneVerified && <div className="reconnect-permission"><ContactConsent checked={consent} onChange={setConsent} /></div>}{(revisiting || (contactReady && !consent)) && <div className="next-row"><Button type="button" variant="action" className="revisit-next" disabled={!contactReady} onClick={() => go('size')}>Next</Button></div>}{answers.who && answers.who !== 'Me' && <Button type="button" variant="quiet" className="wide-button" onClick={() => go('callback')}>They’re not here — arrange a call instead <Phone /></Button>}</form>, { icon: <UserRound /> })
    if (screen === 'loading') return <LoadingState icon={<ShieldCheck />} title="Illustrating your final expense rate" lines={[`Checking plans in ${answers.state || 'your state'}`, 'Calculating your rate', 'Preparing your final expense illustration']} active={loadingLine} duration={2200} />
    if (screen === 'price') return shell('Your final expense quote', '', <div className="illustration"><PriceCard price={shownPrice} coverage={coverage} annual={annual} setAnnual={setAnnual} /><div className="illustration-adjust"><label htmlFor="price-coverage">Adjust coverage</label><div className="illustration-range" style={{ '--coverage-position': (coverage - COVERAGE_MIN) / (COVERAGE_MAX - COVERAGE_MIN) } as CSSProperties}><output className="illustration-range-value" htmlFor="price-coverage" aria-hidden="true">${coverage.toLocaleString()}</output><input id="price-coverage" type="range" min={COVERAGE_MIN} max={COVERAGE_MAX} step="1000" value={coverage} aria-valuetext={`$${coverage.toLocaleString()} of final expense coverage`} onChange={(event) => update('coverage', event.target.value)} /></div></div><Button variant="action" size="touch" className="continue-button illustration-next" onClick={() => { go(editingCoverage ? 'decision' : 'who'); setEditingCoverage(false) }}><span className="illustration-cta-paw" aria-hidden="true"><PawGlyph /></span>{editingCoverage ? 'Save changes' : 'Make it mine'}</Button></div>, { icon: <CoverageBadgeIcon /> })
    if (screen === 'address') return shell('What is your home address?', '', <form className="centered-step address-step" onSubmit={submitNext('identity', Boolean(answers.street.trim() && answers.city.trim() && answers.state && /^\d{5}$/.test(answers.zip)), 'Please enter your street, city, state and five-digit ZIP code.')}>
      <AddressAutocomplete value={answers.street} onChange={(value) => update('street', value)} onPick={(pick) => { const match = LICENSED_STATES.find((item) => item.abbr === pick.stateCode); setAnswers((current) => ({ ...current, street: pick.street || current.street, apt: pick.apt || current.apt, city: pick.city || current.city, state: match ? match.name : current.state, zip: pick.zip || current.zip })); setError(match || !pick.stateCode ? '' : 'PolicyBear is not yet available in that state.') }} />
      <div className="address-tile-row">{tile('apt', 'Apt / suite', true, { autoComplete: 'address-line2', placeholder: 'Apt, suite or unit' })}{tile('city', 'City', false, { autoComplete: 'address-level2', placeholder: 'City' })}</div>
      <div className="address-tile-row location"><label className={`contact-tile${answers.state ? ' is-filled' : ''}`}><span className="contact-tile-label">State<span className="contact-required" aria-hidden="true"> *</span></span><span className="measurement-select"><select aria-label="State" required autoComplete="address-level1" value={answers.state} onChange={(event) => update('state', event.target.value)}><option value="">Select state</option>{LICENSED_STATES.map((item) => <option key={item.abbr} value={item.name}>{item.name} ({item.abbr})</option>)}</select><ChevronDown aria-hidden="true" /></span></label>{tile('zip', 'ZIP code', false, { inputMode: 'numeric', autoComplete: 'postal-code', placeholder: '12345', pattern: '\\d{5}', maxLength: 5, onChange: (event) => update('zip', event.target.value.replace(/\D/g, '').slice(0, 5)) })}</div>
      <div className="next-row"><Button type="submit" variant="action" className="revisit-next">Next</Button></div>
    </form>, { icon: <MapPin /> })
    if (screen === 'identity') return shell('A few identity details', '', <form className="centered-step identity-step" onSubmit={submitNext('ssn', identityReady)}>
      <div className="identity-birth-fields">{(['country', ...(answers.country === 'United States' ? ['birthState'] : [])] as ('country' | 'birthState')[]).map((key) => <label key={key} className={`contact-tile${answers[key] ? ' is-filled' : ''}`}><span className="contact-tile-label">{key === 'country' ? 'Country of birth' : 'State of birth'}</span><span className="measurement-select"><select aria-label={key === 'country' ? 'Country of birth' : 'State of birth'} required value={answers[key]} onChange={(event) => chooseIdentity(key, event.target.value)}><option value="">Select {key === 'country' ? 'country' : 'state'}</option>{(key === 'country' ? ['United States', 'Canada', 'Other'] : US_STATES).map((option) => <option key={option}>{option}</option>)}</select><ChevronDown aria-hidden="true" /></span></label>)}</div>
      <fieldset className="identity-question"><legend>Are you a U.S. citizen?</legend><Radio.Root aria-label="Are you a U.S. citizen?" value={answers.citizen} onValueChange={(value) => chooseIdentity('citizen', value)} className="identity-choices">{[{ value: 'Yes — U.S. citizen', label: 'Yes' }, { value: 'No', label: 'No' }].map((option) => <Radio.Item key={option.value} value={option.value} className="identity-choice"><strong>{option.label}</strong></Radio.Item>)}</Radio.Root></fieldset>
      {answers.citizen === 'No' && <fieldset className="identity-question"><legend>Have you been a U.S. resident for over 2 years?</legend><Radio.Root aria-label="U.S. residency" value={answers.resident} onValueChange={(value) => chooseIdentity('resident', value)} className="identity-choices">{[{ value: 'Yes — resident over 2 years', label: 'Yes' }, { value: 'No — neither', label: 'No' }].map((option) => <Radio.Item key={option.value} value={option.value} className="identity-choice"><strong>{option.label}</strong></Radio.Item>)}</Radio.Root></fieldset>}
    </form>, { icon: <Fingerprint /> })
    if (screen === 'ssn') return shell('Your Social Security number', '', <form className="centered-step ssn-form" onSubmit={submitNext('owner', ssnProtected, 'Please enter a 9-digit Social Security number.')}>
      <label className={`contact-tile ssn-input-tile${answers.ssn ? ' is-filled' : ''}`}><span className="contact-tile-label"><LockKeyhole aria-hidden="true" />Social Security number<span className="contact-required" aria-hidden="true">*</span></span><span className="ssn-input-row"><input aria-label="Social Security number" required value={answers.ssn} type={showSSN ? 'text' : 'password'} inputMode="numeric" maxLength={11} placeholder="123-45-6789" autoComplete="off" onChange={(event) => update('ssn', formatSSN(event.target.value))} /><Button type="button" variant="quiet" className="ssn-visibility" aria-label={showSSN ? 'Hide number' : 'Show number'} onClick={() => setShowSSN(!showSSN)}>{showSSN ? <EyeOff /> : <Eye />}</Button></span></label>
      <TrustBadges />
      <div className="next-row"><Button type="submit" variant="action" className="revisit-next" disabled={!ssnProtected}>Next</Button></div>
    </form>, { icon: <LockKeyhole /> })
    if (screen === 'owner') return shell('Will you be the policy owner and the person paying?', '', <div className="centered-step owner-step"><Radio.Root aria-label="Policy owner" value={answers.owner} onValueChange={(value) => update('owner', value)} className="identity-choices">{['Yes', 'No'].map((option) => <Radio.Item key={option} value={option} className="identity-choice" onClick={() => choose('owner', option, option === 'Yes' ? 'h1' : 'ineligible')}><strong>{option}</strong></Radio.Item>)}</Radio.Root></div>, { icon: <UserRound /> })
    if (screen === 'health-intro' || /^h[1-8]$/.test(screen)) {
      const index = screen === 'health-intro' ? 0 : Number(screen.slice(1)) - 1
      const item = healthQuestions[index] ?? healthQuestions[0]
      const value = answers.health[index] || ''
      return shell(item.question, '', <div className="centered-step health-step">
        <Radio.Root aria-label={`Health question ${index + 1}`} value={value} onValueChange={(v) => setAnswers((current) => ({ ...current, health: current.health.map((answer, i) => i === index ? v : answer) }))} className="identity-choices health-choices">
          {(['No', 'Yes'] as const).map((option) => <Radio.Item key={option} className="identity-choice" value={option} onClick={() => healthChoice(index, option)}><strong>{option}</strong></Radio.Item>)}
        </Radio.Root>
      </div>, { icon: <HeartPulse /> })
    }
    if (screen === 'underwriting') return <CoverageLoading />
    if (screen === 'eligibility') return <Decision outcome="declined" firstName={answers.firstName} coverage={coverage} price={monthly} onContinue={() => go('gi-offer')} onCallback={() => go('callback')} />
    if (screen === 'decision') return <Decision outcome={answers.coverageType === 'Guaranteed Issue' ? 'approved' : outcome} firstName={answers.firstName} coverage={coverage} price={monthly} onContinue={() => go('payment')} onEdit={() => { setEditingCoverage(true); setAnnual(false); go('price') }} onCallback={() => go('callback')} />
    if (screen === 'gi-offer') return shell('Guaranteed-issue final expense coverage', 'No health questions. Ages 50–85. Pick an amount to see your price.', <><Radio.Root value={answers.coverage} onValueChange={(value) => update('coverage', value)} className="answer-grid">{['5000', '10000', '15000', '20000', '25000'].map((value) => <Radio.Item className="answer-card" value={value} key={value}><strong>${Number(value).toLocaleString()}</strong></Radio.Item>)}</Radio.Root><PriceCard price={calculatePrice(age || 68, answers.gender || 'Female', Math.min(coverage, 25000), answers.tobacco, 'guaranteed')} coverage={Math.min(coverage, 25000)} annual={annual} setAnnual={setAnnual} /><div className="info-panel">If death occurs from natural causes in the first 2 years, your beneficiary receives the premiums paid plus interest. Accidental loss is covered in full from day one. After 2 years, the full benefit is paid. [CARRIER_TO_CONFIRM]</div><div className="next-row"><button type="button" className="revisit-next" onClick={() => { update('coverageType', 'Guaranteed Issue'); go('beneficiary') }}>Next</button></div></>, { icon: <ShieldCheck /> })
    if (screen === 'beneficiary') {
      const isPerson = answers.beneficiaryType === 'A person'
      const beneficiaryPhoneDigits = answers.beneficiaryPhone.replace(/\D/g, '')
      const beneficiaryValid = !isPerson || Boolean(
        answers.beneficiaryFirst.trim() && answers.beneficiaryLast.trim() && answers.relationship &&
        answers.beneficiaryKnowPhone &&
        (answers.beneficiaryKnowPhone === 'No' || beneficiaryPhoneDigits.length >= 10) &&
        answers.beneficiaryKnowAddress &&
        (answers.beneficiaryKnowAddress === 'No' || answers.beneficiaryAddress.trim()))
      return shell('Primary beneficiary', '', <form className="centered-step beneficiary-step" onSubmit={submitNext('insurance', beneficiaryValid, 'Please complete the primary beneficiary details.')}>
        <label className={`contact-tile${answers.beneficiaryType ? ' is-filled' : ''}`}>
          <span className="contact-tile-label">Beneficiary type<span className="contact-required" aria-hidden="true"> *</span></span>
          <span className="measurement-select">
            <select aria-label="Beneficiary type" value={answers.beneficiaryType} onChange={(event) => update('beneficiaryType', event.target.value)}>
              {['A person', 'My estate', 'All my children, equally', 'A trust', 'A charity or organisation'].map((option) => <option key={option}>{option}</option>)}
            </select>
            <ChevronDown aria-hidden="true" />
          </span>
        </label>
        {isPerson && <>
          <label className={`contact-tile${answers.relationship ? ' is-filled' : ''}`}>
            <span className="contact-tile-label">Relationship<span className="contact-required" aria-hidden="true"> *</span></span>
            <span className="measurement-select">
              <select aria-label="Relationship" value={answers.relationship} onChange={(event) => update('relationship', event.target.value)}>
                <option value="">Select relationship</option>
                {['Spouse', 'Husband', 'Wife', 'Son', 'Daughter', 'Grandson', 'Granddaughter', 'Brother', 'Sister', 'Mother', 'Father', 'Nephew', 'Niece', 'Friend', 'Domestic Partner', 'Other'].map((option) => <option key={option}>{option}</option>)}
              </select>
              <ChevronDown aria-hidden="true" />
            </span>
          </label>
          <div className="two-fields">{tile('beneficiaryFirst', 'First name')}{tile('beneficiaryLast', 'Last name')}</div>
          <fieldset className="identity-question"><legend>Do you know the phone number for this beneficiary?<span className="contact-required" aria-hidden="true"> *</span></legend>
            <Radio.Root aria-label="Do you know the phone number for this beneficiary?" value={answers.beneficiaryKnowPhone} onValueChange={(value) => update('beneficiaryKnowPhone', value)} className="identity-choices">{['Yes', 'No'].map((option) => <Radio.Item key={option} value={option} className="identity-choice"><strong>{option}</strong></Radio.Item>)}</Radio.Root>
          </fieldset>
          {answers.beneficiaryKnowPhone === 'Yes' && tile('beneficiaryPhone', 'Phone number', false, { type: 'tel', placeholder: '(***) ***-****' })}
          <fieldset className="identity-question"><legend>Do you know the address for this beneficiary?<span className="contact-required" aria-hidden="true"> *</span></legend>
            <Radio.Root aria-label="Do you know the address for this beneficiary?" value={answers.beneficiaryKnowAddress} onValueChange={(value) => update('beneficiaryKnowAddress', value)} className="identity-choices">{['Yes', 'No'].map((option) => <Radio.Item key={option} value={option} className="identity-choice"><strong>{option}</strong></Radio.Item>)}</Radio.Root>
          </fieldset>
          {answers.beneficiaryKnowAddress === 'Yes' && tile('beneficiaryAddress', 'Street address', false, { placeholder: 'Street, city, state, ZIP' })}
        </>}
        <div className="next-row"><Button type="button" variant="action" className="revisit-next" onClick={submitNext('insurance', beneficiaryValid, 'Please complete the primary beneficiary details.')}>Next</Button></div>
      </form>, { icon: <Users /> })
    }
    if (screen === 'insurance') return shell('Do you have any other life insurance or annuities, or a pending application?', '', <div className="centered-step health-step">
      <Radio.Root aria-label="Other life insurance" value={answers.otherInsurance} onValueChange={(value) => update('otherInsurance', value)} className="identity-choices health-choices">{['No', 'Yes'].map((option) => <Radio.Item key={option} className="identity-choice" value={option} onClick={() => choose('otherInsurance', option, option === 'No' ? 'underwriting' : undefined)}><strong>{option}</strong></Radio.Item>)}</Radio.Root>
      {answers.otherInsurance === 'Yes' && <fieldset className="identity-question"><legend>Will this policy replace or be paid for by cancelling any of them?</legend><Radio.Root aria-label="Replacement policy" value={answers.replacing} onValueChange={(value) => update('replacing', value)} className="identity-choices health-choices">{['No', 'Yes'].map((option) => <Radio.Item key={option} className="identity-choice" value={option} onClick={() => choose('replacing', option, 'underwriting')}><strong>{option}</strong></Radio.Item>)}</Radio.Root>{answers.replacing === 'Yes' && <p className="fine-print">We’ll include a replacement notice in your documents. [STATE_REPLACEMENT_FORMS]</p>}</fieldset>}
    </div>, { icon: <ShieldCheck /> })
    if (screen === 'payment') {
      const isBank = answers.paymentMethod !== 'Debit or credit card'
      const routingInfo = lookupRouting(answers.routing)
      const brand = cardBrand(answers.card)
      const cardOk = luhnValid(answers.card)
      const expOk = expiryValid(answers.expiry)
      const ready = Boolean(answers.accountName) && (isBank ? routingInfo.status === 'verified' && answers.account.length >= 4 : cardOk && expOk && answers.paymentZip.length === 5)
      const digits = (key: StringAnswerKey, max: number) => (event: React.ChangeEvent<HTMLInputElement>) => update(key, event.target.value.replace(/\D/g, '').slice(0, max))
      return shell('Choose your preferred payment method to continue.', '', <form className="centered-step pay-form" onSubmit={(event) => { event.preventDefault(); if (!ready) { setError(isBank ? 'Please complete your bank details — the routing number must verify.' : 'Please enter a valid card number, expiry and ZIP.'); return } setPaymentSavedAt(new Date()); go('payment-saved') }}>
        <Radio.Root aria-label="Payment method" value={answers.paymentMethod} onValueChange={(value) => update('paymentMethod', value)} className="identity-choices pay-method-choices">
          {(['EFT', 'Debit or credit card'] as const).map((option) => <Radio.Item className="identity-choice pay-method-choice" key={option} value={option} onClick={() => update('paymentMethod', option)}><span className="pay-method-icon" aria-hidden="true">{option === 'EFT' ? <Landmark /> : <CreditCard />}</span><strong>{option}</strong></Radio.Item>)}
        </Radio.Root>
        <div className="pay-fields">
          {isBank ? <>
            {field('accountName', 'Account holder name', { autoComplete: 'name' })}
            <label className={`contact-tile${answers.routing ? ' is-filled' : ''}`}><span className="contact-tile-label">Routing number<span className="contact-required" aria-hidden="true"> *</span></span>
              <div className={`pay-input is-${routingInfo.status}`}><Landmark className="pay-lead" aria-hidden="true" /><input className="text-field" inputMode="numeric" autoComplete="off" placeholder="9 digits" value={answers.routing} onChange={digits('routing', 9)} /><span className="pay-count">{routingInfo.status === 'verified' ? <Check /> : `${answers.routing.length}/9`}</span></div>
            </label>
            <div className="pay-status" aria-live="polite">
              {routingInfo.status === 'verified' && <div className="bank-chip"><span className="bank-chip-icon"><Landmark /></span><span><strong>{routingInfo.bank}</strong><small>{routingInfo.detail}</small></span><span className="bank-chip-ok"><ShieldCheck /> Verified</span></div>}
              {routingInfo.status === 'invalid' && <p className="pay-error"><AlertCircle /> We couldn’t find that routing number. Check the 9 digits at the bottom-left of a check.</p>}
            </div>
            <label className={`contact-tile${answers.account ? ' is-filled' : ''}`}><span className="contact-tile-label">Account number<span className="contact-required" aria-hidden="true"> *</span></span>
              <div className="pay-input"><input className="text-field" type="password" inputMode="numeric" autoComplete="off" placeholder="4–17 digits" value={answers.account} onChange={digits('account', 17)} /></div>
            </label>
          </> : <>
            {field('accountName', 'Name on card', { autoComplete: 'cc-name' })}
            <label className={`contact-tile${answers.card ? ' is-filled' : ''}`}><span className="contact-tile-label pay-label-row">Card number<span className="contact-required" aria-hidden="true"> *</span><span className="pay-brands" aria-hidden="true"><span className="pay-brand brand-visa">VISA</span><span className="pay-brand brand-mc"><i /><i /></span><span className="pay-brand brand-amex">AMEX</span><span className="pay-brand brand-disc">DISCOVER</span></span></span>
              <div className={`pay-input${cardOk ? ' is-verified' : answers.card.length >= 15 && !cardOk ? ' is-invalid' : ''}`}><CreditCard className="pay-lead" aria-hidden="true" /><input className="text-field" inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" value={formatCard(answers.card)} onChange={digits('card', 19)} />{brand && <span className="card-brand">{brand}</span>}</div>
            </label>
            <div className="pay-fields-pair">
              <label className={`contact-tile${answers.expiry ? ' is-filled' : ''}`}><span className="contact-tile-label">Expiry<span className="contact-required" aria-hidden="true"> *</span></span>
                <div className={`pay-input${expOk ? ' is-verified' : answers.expiry.length === 5 ? ' is-invalid' : ''}`}><input className="text-field" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" value={answers.expiry} onChange={(event) => update('expiry', formatExpiry(event.target.value))} /></div>
              </label>
              <label className={`contact-tile${answers.paymentZip ? ' is-filled' : ''}`}><span className="contact-tile-label">Billing ZIP<span className="contact-required" aria-hidden="true"> *</span></span>
                <div className="pay-input"><input className="text-field" inputMode="numeric" autoComplete="postal-code" placeholder="5 digits" value={answers.paymentZip} onChange={digits('paymentZip', 5)} /></div>
              </label>
            </div>
          </>}
        </div>
        <div className="next-row panel-foot"><Button type="submit" variant="action" className="revisit-next" disabled={!ready}>Save</Button></div>
      </form>, { icon: <Landmark /> })
    }
    if (screen === 'payment-saved') {
      const isBank = answers.paymentMethod !== 'Debit or credit card'
      const savedTime = paymentSavedAt?.toLocaleString(undefined, { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      return shell(isBank ? 'EFT Details Saved Successfully' : 'Card Details Saved Successfully', '', <div className="centered-step payment-confirmation">
        <p className="payment-confirmation-subtitle">Your {isBank ? 'bank transfer' : 'card'} details are ready for this application.</p>
        <div className="payment-receipt">
          <p className="payment-receipt-note">No transaction has been processed. Continue to review your documents and sign your application.</p>
          <dl className="payment-receipt-details"><div><dt>Payment Method</dt><dd>{isBank ? 'Electronic Fund Transfer (EFT)' : 'Debit or credit card'}</dd></div><div><dt>Date &amp; Time</dt><dd>{savedTime || 'Not saved in this session'}</dd></div></dl>
          <div className="payment-receipt-total"><span>Amount to be charged</span><strong>${monthly.toFixed(2)}</strong></div>
        </div>
        <Button type="button" variant="action" className="revisit-next payment-confirmation-continue" onClick={() => go('sign-delivery')}>Continue</Button>
      </div>, { icon: <svg className="payment-success-seal" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path className="payment-success-seal-fill" d="m32 3 7.1 6.3 9.4-.2 2.7 9 7.8 5.2-3.1 8.7 3.1 8.7-7.8 5.2-2.7 9-9.4-.2L32 61l-7.1-6.3-9.4.2-2.7-9L5 40.7 8.1 32 5 23.3l7.8-5.2 2.7-9 9.4.2L32 3Z" /><path className="payment-success-seal-check" d="m21 32 7.5 7.5L44 24" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg> })
    }
    if (screen === 'sign-delivery' || screen === 'disclosures') return shell('Signature Flow', `Complete the electronic signature process${answers.firstName ? ` for ${answers.firstName} ${answers.lastName}` : ''}.`, <SignatureFlow stage={screen === 'sign-delivery' ? 'delivery' : 'authorize'} delivery={pinDelivery} onDelivery={setPinDelivery} onConfirm={() => go('disclosures')} onAnotherWay={() => go('sign-delivery')} onSign={() => go('submitting')} name={[answers.firstName, answers.middleName, answers.lastName].filter(Boolean).join(' ')} email={answers.email} phone={answers.phone} address={[answers.street, answers.apt, answers.city, answers.state, answers.zip].filter(Boolean).join(', ')} beneficiary={answers.beneficiaryType === 'A person' ? `${answers.beneficiaryFirst} ${answers.beneficiaryLast}`.trim() : answers.beneficiaryType} coverage={coverage} monthly={monthly} paymentMethod={answers.paymentMethod} />, { icon: <PenLine /> })
    if (screen === 'signature') return shell('Sign your application', 'Choose how you would like to sign.', <><div className="signature-mode" role="group" aria-label="Signature method"><Button type="button" variant={signatureMode === 'type' ? 'action' : 'quiet'} onClick={() => setSignatureMode('type')}>Type signature</Button><Button type="button" variant={signatureMode === 'draw' ? 'action' : 'quiet'} onClick={() => setSignatureMode('draw')}><PenLine /> Draw signature</Button></div>{signatureMode === 'type' ? <>{field('signature', 'Full legal name')}<p className="field-prompt">Choose a signature style</p><div className="signature-styles" role="radiogroup" aria-label="Signature style">{['Classic', 'Smooth', 'Simple'].map((label, index) => <Button type="button" variant="quiet" role="radio" aria-checked={signatureStyle === index} className={signatureStyle === index ? 'selected' : ''} onClick={() => setSignatureStyle(index)} key={label}><span className={`signature-sample signature-style-${index}`}>{answers.signature || 'Your name'}</span><small>{label}</small></Button>)}</div><div className={`signature-preview signature-style-${signatureStyle}`}>{answers.signature || 'Your signature'}</div></> : <DrawSignature onChange={setHasDrawing} />}<p className="valid-note">Dated {new Date().toLocaleDateString()}</p><CheckRow checked={signed} onChange={setSigned}>I agree to sign electronically and that this is my legal signature.</CheckRow><Button variant="action" size="touch" className="continue-button" disabled={!signed || (signatureMode === 'type' ? answers.signature.trim().length < 3 : !hasDrawing)} onClick={() => go('verify')}>Continue</Button></>)
    if (screen === 'verify') return shell('Verify it’s you', `We sent a 6-digit code to ${answers.phone ? `(***) ***-${answers.phone.replace(/\D/g, '').slice(-4)}` : '(•••) •••-1234'} (mock).`, <><label className="field-label">Verification code<input className="text-field code-field" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" maxLength={6} autoComplete="one-time-code" /></label><p className="question-call">Any 6 digits work in this prototype.</p><Button variant="quiet" className="wide-button">Send by email instead</Button><Button variant="action" size="touch" className="continue-button" disabled={code.length !== 6} onClick={() => go('submitting')}>Sign and submit</Button></>)
    if (screen === 'submitting') return <LoadingState icon={<Sparkles />} title="Submitting your application…" lines={['Reviewing your signature', 'Issuing your policy…', 'All done!']} active={loadingLine} duration={2200} />
    if (screen === 'issued') return shell(`Final expense demo complete, ${answers.firstName || 'friend'}.`, '', <><div className="success-symbol"><Check /></div><div className="policy-card"><span>Policy number <strong>{policyNumber || 'PB-FE-000000'}</strong></span><span>Coverage <strong>${coverage.toLocaleString()}</strong></span><span>Monthly premium <strong>${monthly.toFixed(2)}</strong></span><span>First draft <strong>{answers.draftDate}</strong></span><span>Beneficiary <strong>{answers.beneficiaryFirst || answers.beneficiaryType}</strong></span><span>Coverage type <strong>{answers.coverageType || (outcome === 'graded' ? 'Graded' : 'Immediate')}</strong></span></div><div className="next-list"><strong>What happens next</strong><span>In a real final expense application, policy documents would be sent to {answers.email || 'your email'}.</span><span>Save our number {phone}.</span><span>Tell your beneficiary where to find your policy.</span></div><Button variant="action" size="touch" className="wide-button" onClick={() => window.print()}>Print this page</Button></>, { back: false })
    if (screen === 'callback') return shell('Request a call back', 'Discuss final expense options with an agent. This demo does not send a callback request.', <form onSubmit={submitNext('state', Boolean(answers.firstName && answers.phone && consent))}>{field('firstName', 'Name')}{field('phone', 'Phone', { type: 'tel' })}{cards('callbackTime', ['Morning', 'Afternoon', 'Evening'], undefined, callbackIcons)}<ContactConsent checked={consent} onChange={setConsent} /><Button variant="action" size="touch" className="wide-button">Request my call</Button></form>)
    return shell('An agent can help set this up for you', 'You still have options. Talk with a licensed agent for personal help.', <><Button asChild variant="action" size="touch" className="wide-button"><a href={`tel:${phone}`}><Phone /> Call {phone}</a></Button><Button variant="quiet" className="wide-button" onClick={() => go('callback')}>Request a call back</Button></>)
  }

  const chapter = chapterFor(screen)
  const progress = chapterProgress(screen)
  const appMode = screen !== 'state'
  const tip = bearTips[screen]
  const minutes = [1, 1, 2, 2]
  // The quote panel only belongs once the illustration has actually been shown.
  const quoteSeen = journeySteps.indexOf(screen) > journeySteps.indexOf('price')
  if (appMode) return <section className={quoteSeen ? 'wizard-app' : 'wizard-app no-quote'} id="get-covered" aria-label="Final expense application">
    <aside className="app-rail" aria-label="Application progress">
      <Link to="/" hash="step-state" className="app-rail-logo" aria-label="PolicyBear home"><img src={bearLogo.url} width="190" height="38" alt="PolicyBear" /></Link>
      <ol className="app-steps">{labels.map((label, index) => <li key={label} className={index === chapter ? 'current' : index < chapter ? 'complete' : ''} aria-current={index === chapter ? 'step' : undefined}><span className="app-step-dot">{index < chapter ? <Check /> : <span />}</span><span className="app-step-copy"><strong>{label}</strong><small><Clock /> {minutes[index]} min</small></span></li>)}</ol>
      <p className="app-rail-secure"><LockKeyhole /> Demo only · nothing is submitted</p>
    </aside>
    <div className="app-main">
      <div className="app-topbar">{!['state', 'issued', 'loading', 'underwriting', 'submitting'].includes(screen) && <button type="button" className="back-orb app-topbar-back" onClick={back} aria-label="Go back to the previous question"><span className="back-orb-icon"><ArrowLeft /></span><span className="back-orb-label">Back</span></button>}<span className="app-chapter"><strong>{labels[chapter]}</strong><em className="app-chapter-meter" aria-hidden="true"><i style={{ width: `${(progress.position / progress.total) * 100}%` }} /></em><small>{progress.position} of {progress.total}</small></span><a className="app-call" href="tel:+18447652327"><span className="agent-dot" aria-hidden="true" /><span className="app-call-copy"><small>Licensed Agents Available</small><strong>(844) POL-BEAR</strong></span></a></div>
      <div className="app-body">{tip ? <div className="basic-stage app-tip-stage"><aside className="bear-tip" aria-label="Tip from Mr Bear">
        <div className="bear-tip-bubble" key={screen}><span className="bear-tip-kicker"><PawGlyph /> Mr Bear’s fact check</span><div className="bear-flip"><div className="bear-flip-spin"><div className="bear-flip-face is-myth"><span className="bear-flip-chip">Myth</span><p>{tip.myth}</p></div><div className="bear-flip-face is-fact"><span className="bear-flip-chip">Fact</span><p>{tip.fact}</p></div></div></div></div>
        <img className="bear-tip-img" src={bearGuide} width={595} height={959} alt="" aria-hidden="true" />
      </aside>{renderScreen()}</div> : renderScreen()}</div>
    </div>
    {quoteSeen && <aside className="app-summary" aria-label="Your quote">
      <div className="app-quote-card">
        <div className="app-quote-brand"><img src={bearLogo.url} width="150" height="30" alt="PolicyBear" /><span className="app-quote-tag">Final Expense</span></div>
        <div className="app-quote-price"><small>Your monthly premium</small><strong>${monthly.toFixed(2)}<span>/mo</span></strong></div>
        <dl><div><dt>Coverage</dt><dd>${coverage.toLocaleString()}</dd></div></dl>
        <div className="app-quote-chips"><span><ShieldCheck /> Level premium</span><span><Check /> No medical exam</span></div>
        <Button variant="quiet" className="app-edit" onClick={() => go('price')}>Edit quote <PenLine /></Button>
      </div>
    </aside>}
  </section>

  const wizardSection = <section className={`wizard ${screen !== 'state' ? 'wizard-standalone' : ''}`} id="get-covered" aria-label="Final expense journey">
    {resume && <div className="resume-banner"><p>Welcome back, {answers.firstName || 'friend'}! Pick up where you left off?</p><div><Button variant="quiet" onClick={() => setResume(false)}>Continue</Button><Button variant="quiet" onClick={() => { setAnswers(blank); localStorage.removeItem('policybear-demo'); go('state') }}>Start over</Button></div></div>}
    <div className="chapter-progress" aria-label="Application progress">{labels.map((label, index) => <span className={index === chapter ? 'current' : index < chapter ? 'complete' : ''} key={label}>{index < chapter && <Check />}{label}</span>)}</div>
    {quoteIndex >= 0 && <div className="progress-track"><div className="progress-fill" style={{ width: `${((quoteIndex + 1) / quoteSteps.length) * 100}%` }} /></div>}
    {screenIndex >= journeySteps.indexOf('address') && screenIndex <= journeySteps.indexOf('issued') && <div className="mini-summary">Coverage ${coverage.toLocaleString()} · ${monthly.toFixed(2)}/mo <a href={`tel:${phone}`}>Need help? {phone}</a></div>}
    {renderScreen()}
    <div className="demo-wrap"><Button variant="quiet" className="demo-pill" aria-expanded={demo} onClick={() => setDemo(!demo)}>Demo</Button>{demo && <div className="demo-toolbar"><strong>Jump to a screen</strong><select aria-label="Demo screen" value={screen} onChange={(event) => go(event.target.value as JourneyStep)}>{journeySteps.map((item) => <option value={item} key={item}>{item.replaceAll('-', ' ')}</option>)}</select><strong>Force decision</strong><div>{(['approved', 'graded', 'declined'] as Outcome[]).map((item) => <Button variant={forced === item ? 'action' : 'quiet'} key={item} onClick={() => setForced(item)}>{item}</Button>)}</div></div>}</div>
  </section>
  return wizardSection
}

function ContactConsent({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="contact-consent">
    <CheckRow checked={checked} onChange={onChange}>
      <span className="consent-paragraph">By checking this box, I agree that PolicyBear and its licensed agents may call or text me about final expense insurance at the number above, including with automated technology or prerecorded messages, even if I’m on a Do Not Call list.</span>
      <span className="consent-paragraph">Consent isn’t required to buy. Message and data rates may apply. Reply STOP to opt out.</span>
      <span className="consent-paragraph">I agree to the <Link to="/terms-conditions" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</Link> and acknowledge the <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.</span>
    </CheckRow>
  </div>
}
function NextButton() { return <div className="next-row"><button type="submit" className="revisit-next">Next</button></div> }

function TrustBadges() {
  return <div className="ssn-trust">
    <div className="ssn-trust-seals" aria-label="Security verification seals">
      <div className="ssn-seal-slot"><img className="ssn-seal" src={geotrustSeal.url} alt="Secured by GeoTrust" width="407" height="111" /></div>
      <div className="ssn-seal-slot"><img className="ssn-seal" src={trusteSeal.url} alt="TRUSTe Certified Privacy, powered by TrustArc" width="338" height="119" /></div>
      <div className="ssn-seal-slot"><img className="ssn-seal" src={trustlockSeal.url} alt="TrustLock verified SSL secure" width="317" height="125" /></div>
    </div>
  </div>
}
function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: (value: boolean) => void; children: React.ReactNode }) { return <label className="check-row"><Checkbox.Root checked={checked} onCheckedChange={(value) => onChange(value === true)}><Checkbox.Indicator><Check /></Checkbox.Indicator></Checkbox.Root><span>{children}</span></label> }
function DrawSignature({ onChange }: { onChange: (drawn: boolean) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    return { x: (event.clientX - bounds.left) * event.currentTarget.width / bounds.width, y: (event.clientY - bounds.top) * event.currentTarget.height / bounds.height }
  }
  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const context = event.currentTarget.getContext('2d')
    if (!context) return
    const position = point(event)
    event.currentTarget.setPointerCapture(event.pointerId)
    context.beginPath()
    context.moveTo(position.x, position.y)
    drawing.current = true
  }
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const context = event.currentTarget.getContext('2d')
    if (!context) return
    const position = point(event)
    context.lineWidth = 3
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.strokeStyle = getComputedStyle(event.currentTarget).getPropertyValue('--brand-deep').trim()
    context.lineTo(position.x, position.y)
    context.stroke()
    onChange(true)
  }
  const stop = () => { drawing.current = false }
  const clear = () => {
    const element = canvas.current
    const context = element?.getContext('2d')
    if (element && context) context.clearRect(0, 0, element.width, element.height)
    onChange(false)
  }

  return <div className="draw-signature"><div className="draw-heading"><span>Draw your signature below</span><Button type="button" variant="quiet" onClick={clear}><RotateCcw /> Clear</Button></div><canvas ref={canvas} width="470" height="180" aria-label="Draw your signature" onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onPointerLeave={stop} /><p>Use your finger, mouse, or trackpad.</p></div>
}
function CoverageLoading() {
  return <div className="coverage-loading" role="status" aria-live="polite">
    <div className="coverage-loading-art" aria-hidden="true"><svg className="coverage-loading-ring" viewBox="0 0 160 160"><circle className="coverage-loading-track" cx="80" cy="80" r="70" /><circle className="coverage-loading-progress" cx="80" cy="80" r="70" /></svg><div className="coverage-loading-shield"><CoverageBadgeIcon /></div><div className="coverage-loading-trail">{[0, 1, 2, 3].map((i) => <span key={i}><PawGlyph /></span>)}</div></div>
    <h2>Preparing your coverage</h2><p>Bringing your details together.<br />Stay with us for a moment.</p>
    <div className="coverage-loading-bar" aria-hidden="true"><span /></div>
  </div>
}
function LoadingState({ icon, title, lines, active, duration = 2200 }: { icon: React.ReactNode; title: string; lines: string[]; active: number; duration?: number }) {
  const style = { '--load-ms': `${duration}ms` } as React.CSSProperties
  return <div className="loading-state" role="status" aria-live="polite" style={style}>
    <div className="load-dial" aria-hidden="true">
      <svg className="load-ring" viewBox="0 0 100 100"><circle className="load-ring-track" cx="50" cy="50" r="44" /><circle className="load-ring-fill" cx="50" cy="50" r="44" /></svg>
      <span className="load-ring-orbit"><i /></span>
      <span className="loading-symbol">{icon}</span>
    </div>
    <h2>{title}</h2>
    <p>This usually takes a few seconds.</p>
    <div className="load-bar" aria-hidden="true"><span /></div>
    <ul className="load-lines">{lines.map((line, index) => <li className={index <= active ? 'done' : index === active + 1 ? 'working' : ''} key={line}><span className="load-mark"><Check /></span><span className="load-line-copy">{line}</span></li>)}</ul>
  </div>
}
function PriceCard({ price, coverage, annual, setAnnual }: { price: number; coverage: number; annual: boolean; setAnnual: (value: boolean) => void }) {
  return <>
    <div className="illustration-period" role="group" aria-label="Payment frequency"><Button variant="quiet" aria-pressed={!annual} onClick={() => setAnnual(false)}>Monthly</Button><Button variant="quiet" aria-pressed={annual} onClick={() => setAnnual(true)}>Yearly</Button></div>
    <p className="illustration-summary"><span className="illustration-price"><strong>${price.toFixed(2)}</strong> per {annual ? 'year' : 'month'}</span><span className="illustration-coverage">for <strong>${coverage.toLocaleString()}</strong> of final expense coverage</span></p>
    {annual && <p className="illustration-saving">5% yearly savings included</p>}
  </>
}
function Decision({ outcome, firstName, coverage, price, onContinue, onEdit, onCallback }: { outcome: Outcome; firstName: string; coverage: number; price: number; onContinue: () => void; onEdit?: () => void; onCallback: () => void }) {
  if (outcome === 'declined') return <div className="wizard-content"><div className="decision-symbol warm"><Heart /></div><h2>This demo shows a decline for this final expense plan — other options may be available.</h2><div className="option-card"><strong>Guaranteed-issue final expense</strong><p>No health questions. You can’t be turned down for health reasons.</p><Button variant="action" size="touch" onClick={onContinue}>See guaranteed coverage</Button></div><div className="option-card"><strong>Talk to a licensed agent</strong><p>An agent can discuss other final expense options with you.</p><Button variant="quiet" onClick={onCallback}>Request a call back</Button></div></div>
  const graded = outcome === 'graded'
  const name = firstName || 'friend'
  return <div className="wizard-content celebrate">
    <div className="celebrate-burst" aria-hidden="true">{Array.from({ length: 48 }, (_, index) => <i key={index} style={{ '--burst-origin': index % 2 ? '82%' : '18%', '--burst-x': `${(index % 2 ? -1 : 1) * (45 + index % 8 * 24)}px`, '--burst-y': `${-95 - index % 7 * 22}px`, '--burst-turn': `${index * 67}deg`, '--burst-delay': `${index % 6 * 65}ms` } as CSSProperties} />)}</div>
    <span className="celebrate-seal" aria-hidden="true"><PartyPopper /></span>
    <h2 id="wizard-title">{graded ? `Good news, ${name}.` : `Congratulations, ${name}!`}</h2>
    <p className="celebrate-instruction">Click Finalize to provide your payment details and signature — then complete your application.</p>
    <div className="celebrate-brand"><img src={bearLogo.url} alt="PolicyBear" width="160" height="32" /><span>Final Expense</span></div>
    <section className="celebrate-summary" aria-label="Your coverage summary">
      <p className="illustration-summary"><span className="illustration-price"><strong>${price.toFixed(2)}</strong> per month</span><span className="illustration-coverage">for <strong>${coverage.toLocaleString()}</strong> of final expense coverage</span></p>
      {graded && <p className="celebrate-note">For the first 2 years, the full benefit applies to accidental loss only; a partial benefit applies otherwise. Full coverage begins in year 3. [CARRIER_TO_CONFIRM]</p>}
    </section>
    <div className="celebrate-actions">{onEdit && <Button type="button" variant="outline" className="celebrate-edit" onClick={onEdit}><PenLine aria-hidden="true" />Make changes</Button>}<Button type="button" variant="default" className="celebrate-next" onClick={onContinue}><span className="celebrate-paw" aria-hidden="true"><PawGlyph /></span>Finalize</Button></div>
  </div>
}