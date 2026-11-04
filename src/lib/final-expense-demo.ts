export type Outcome = 'approved' | 'graded' | 'declined'

// Coverage amounts the owner offers: $5,000 to $50,000 (funeral costs, cremation, final bills).
export const COVERAGE_MIN = 5000
export const COVERAGE_MAX = 50000

// Owner-supplied "From" starting prices shown on the coverage choice cards.
export const coverageFromPrices: Record<string, number> = { 10000: 30, 15000: 45, 20000: 60, 25000: 80 }

// Your Profile (shown as "Your Profile", formerly "Basic Info" then "About You") holds the five rating questions (state, gender, date of birth, tobacco, coverage).
// The illustration is shown right after them; the remaining questions are Pre-Qualification.
export const basicInfoSteps = ['state', 'gender', 'dob', 'tobacco', 'coverage'] as const
export const preQualSteps = ['who', 'contact', 'size'] as const
export const quoteSteps = [...basicInfoSteps, ...preQualSteps] as const

export const journeySteps = [
  ...basicInfoSteps, 'loading', 'price', ...preQualSteps,
  'address', 'identity', 'ssn', 'owner', 'health-intro', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8',
  'underwriting', 'decision', 'gi-offer', 'beneficiary', 'insurance', 'payment', 'draft',
  'review', 'disclosures', 'signature', 'verify', 'submitting', 'issued', 'callback', 'ineligible',
] as const

export type JourneyStep = (typeof journeySteps)[number]

export const healthQuestions = [
  {
    topic: 'Your care right now',
    question: 'Are you in a hospital, nursing home or hospice right now, or getting home health care?',
    explain: 'This is about care happening today — a current stay, or home care arranged by a doctor or nurse.',
  },
  {
    topic: 'Serious illness',
    question: 'Has a doctor told you that you have a terminal illness, or that you need an organ transplant?',
    explain: 'This is only about what a doctor has told you directly.',
  },
  {
    topic: 'Equipment you use',
    question: 'Do you use kidney dialysis or oxygen equipment today?',
    explain: 'Only equipment you use now — a short hospital stay in the past doesn’t count.',
  },
  {
    topic: 'Memory & nerve conditions',
    question: 'Have you ever been diagnosed with ALS, Alzheimer’s disease or dementia?',
    explain: 'ALS is also known as Lou Gehrig’s disease.',
  },
  {
    topic: 'Cancer, heart & stroke',
    question: 'In the past 2 years, have you been diagnosed with or treated for cancer (other than a common skin cancer), a heart attack, a stroke, or congestive heart failure?',
    explain: 'A small skin cancer removed at a routine check-up usually doesn’t count.',
  },
  {
    topic: 'Breathing',
    question: 'In the past 2 years, have you been treated for COPD, emphysema or another chronic lung disease?',
    explain: 'Treatment can include an inhaler, oxygen or hospital care.',
  },
  {
    topic: 'Diabetes',
    question: 'In the past 2 years, has diabetes caused you serious problems — such as an amputation, nerve damage, or needing insulin before age 50?',
    explain: 'Diabetes kept in check with pills or diet usually doesn’t count.',
  },
  {
    topic: 'Alcohol, drugs & liver',
    question: 'In the past 2 years, have you been treated for alcohol or drug abuse, or for a liver disease such as cirrhosis or hepatitis?',
    explain: 'Treatment includes care at a clinic, hospital or support program.',
  },
] as const

const rates = [
  [50, 54, 3.1, 2.4], [55, 59, 3.7, 2.8], [60, 64, 4.6, 3.4], [65, 69, 5.9, 4.3],
  [70, 74, 7.8, 5.7], [75, 79, 10.5, 7.8], [80, 85, 14.5, 10.8],
] as const

export function calculatePrice(age: number, gender: string, coverage: number, tobacco: string, kind: 'immediate' | 'graded' | 'guaranteed' = 'immediate') {
  const row = rates.find(([low, high]) => age >= low && age <= high) ?? rates[3]
  const rate = gender === 'Female' ? row[3] : row[2]
  const tobaccoFactor = tobacco === 'Yes' ? 1.35 : 1
  const coverageFactor = kind === 'graded' ? 1.25 : kind === 'guaranteed' ? 1.6 : 1
  return Math.round(((coverage / 1000) * rate * tobaccoFactor * coverageFactor + 3) * 100) / 100
}

export function determineOutcome(health: string[]): Outcome {
  if (health.slice(0, 5).includes('Yes')) return 'declined'
  if (health.slice(5).includes('Yes')) return 'graded'
  return 'approved'
}

export function chapterFor(step: JourneyStep) {
  const index = journeySteps.indexOf(step)
  // Your Profile runs through the five rating questions and the illustration; every later question is Pre-Qualification.
  if (index < journeySteps.indexOf('who')) return 0
  if (index < journeySteps.indexOf('gi-offer')) return 1
  if (index < journeySteps.indexOf('review')) return 2
  return 3
}

// Screens that actually ask the customer something. Used for the "2 of 5" chapter counter,
// so the illustration, underwriting and decision screens don't inflate the total.
const chapterQuestions: readonly JourneyStep[][] = [
  [...basicInfoSteps],
  ['who', 'contact', 'size', 'address', 'identity', 'ssn', 'owner', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8'],
  ['gi-offer', 'beneficiary', 'insurance', 'payment', 'draft'],
  ['review', 'disclosures', 'signature', 'verify'],
]

export function chapterProgress(step: JourneyStep) {
  const chapter = chapterFor(step)
  const list = chapterQuestions[chapter] ?? []
  const index = list.indexOf(step)
  // Screens between questions (illustration, underwriting, decision) sit at the boundary they just crossed.
  const position = index >= 0
    ? index + 1
    : Math.max(1, list.filter((item) => journeySteps.indexOf(item) < journeySteps.indexOf(step)).length)
  return { chapter, position, total: list.length }
}

export const safeSavedKeys = [
  'zip', 'city', 'state', 'who', 'month', 'day', 'year', 'gender', 'tobacco', 'feet', 'inches', 'weight',
  'coverage', 'firstName', 'middleName', 'lastName', 'email', 'phone', 'street', 'apt', 'country', 'birthState',
  'citizen', 'resident', 'owner', 'health', 'beneficiaryType', 'beneficiaryFirst', 'beneficiaryLast',
  'relationship', 'beneficiaryPhone', 'otherInsurance', 'replacing', 'paymentMethod', 'draftDate', 'coverageType',
] as const

export function sanitizedAnswers(value: Record<string, unknown>) {
  return Object.fromEntries(safeSavedKeys.filter((key) => key in value).map((key) => [key, value[key]]))
}
export const US_STATES = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming']

// The only states/jurisdictions the owner sells in. The quote starts by asking for one of these.
export const LICENSED_STATES = [
  { name: 'Alabama', abbr: 'AL' }, { name: 'Alaska', abbr: 'AK' }, { name: 'Arizona', abbr: 'AZ' },
  { name: 'California', abbr: 'CA' }, { name: 'Colorado', abbr: 'CO' }, { name: 'Delaware', abbr: 'DE' },
  { name: 'District of Columbia', abbr: 'DC' }, { name: 'Idaho', abbr: 'ID' }, { name: 'Indiana', abbr: 'IN' },
  { name: 'Iowa', abbr: 'IA' }, { name: 'Kansas', abbr: 'KS' }, { name: 'Louisiana', abbr: 'LA' },
  { name: 'Maine', abbr: 'ME' }, { name: 'Maryland', abbr: 'MD' }, { name: 'Michigan', abbr: 'MI' },
  { name: 'Minnesota', abbr: 'MN' }, { name: 'Missouri', abbr: 'MO' }, { name: 'Montana', abbr: 'MT' },
  { name: 'Nevada', abbr: 'NV' }, { name: 'New Jersey', abbr: 'NJ' }, { name: 'North Dakota', abbr: 'ND' },
  { name: 'Ohio', abbr: 'OH' }, { name: 'Oklahoma', abbr: 'OK' }, { name: 'Pennsylvania', abbr: 'PA' },
  { name: 'Rhode Island', abbr: 'RI' }, { name: 'South Dakota', abbr: 'SD' }, { name: 'Tennessee', abbr: 'TN' },
  { name: 'Texas', abbr: 'TX' }, { name: 'Utah', abbr: 'UT' }, { name: 'Virginia', abbr: 'VA' },
  { name: 'Wyoming', abbr: 'WY' },
] as const


export function formatSSN(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 9)
  if (digits.length > 5) return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
  if (digits.length > 3) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return digits
}
