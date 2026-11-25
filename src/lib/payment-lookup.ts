// Browser-only payment helpers for the demo: nothing is sent anywhere.

const KNOWN_BANKS: Record<string, string> = {
  '021000021': 'JPMorgan Chase Bank', '322271627': 'JPMorgan Chase Bank', '044000037': 'JPMorgan Chase Bank',
  '026009593': 'Bank of America', '121000358': 'Bank of America', '011000138': 'Bank of America', '111000025': 'Bank of America',
  '121000248': 'Wells Fargo Bank', '021200025': 'Wells Fargo Bank', '063107513': 'Wells Fargo Bank',
  '021000089': 'Citibank', '322271724': 'Citibank',
  '091000022': 'U.S. Bank', '123000220': 'U.S. Bank',
  '043000096': 'PNC Bank', '031000053': 'PNC Bank',
  '051405515': 'Capital One', '056073502': 'Capital One',
  '031101266': 'TD Bank', '011103093': 'TD Bank',
  '061000104': 'Truist Bank', '053101121': 'Truist Bank',
  '044000024': 'Huntington National Bank', '072000326': 'Fifth Third Bank', '042000314': 'Fifth Third Bank',
  '062000019': 'Regions Bank', '071000013': 'JPMorgan Chase Bank', '256074974': 'Navy Federal Credit Union',
  '314074269': 'USAA Federal Savings Bank', '124303120': 'Ally Bank', '031176110': 'Capital One',
}

const FED_DISTRICTS = ['', 'Boston', 'New York', 'Philadelphia', 'Cleveland', 'Richmond', 'Atlanta', 'Chicago', 'St. Louis', 'Minneapolis', 'Kansas City', 'Dallas', 'San Francisco']

// Demo-only fallback names for routing numbers not in KNOWN_BANKS, so the
// payment step always shows a bank name beside the Verified badge.
const DEMO_BANKS = [
  'First National Commercial Bank', 'Pacific Meridian Bank', 'Great Lakes Trust Bank',
  'Summit Ridge Bank', 'Atlantic Heritage Bank', 'Cedar Valley Bank',
  'Ironwood Savings Bank', 'Harbor Point Bank', 'Golden Prairie Bank',
]

/** ABA checksum: 3·(d1+d4+d7) + 7·(d2+d5+d8) + (d3+d6+d9) ≡ 0 mod 10. */
export function isValidRouting(routing: string) {
  if (!/^\d{9}$/.test(routing)) return false
  const [a, b, c, e, f, g, h, i, j] = routing.split('').map(Number) as [number, number, number, number, number, number, number, number, number]
  const prefix = Number(routing.slice(0, 2))
  const validPrefix = (prefix >= 0 && prefix <= 12) || (prefix >= 21 && prefix <= 32) || (prefix >= 61 && prefix <= 72) || prefix === 80
  return validPrefix && (3 * (a + e + h) + 7 * (b + f + i) + (c + g + j)) % 10 === 0
}

export type RoutingResult = { status: 'incomplete' } | { status: 'invalid' } | { status: 'verified'; bank: string; detail: string }

export function lookupRouting(routing: string): RoutingResult {
  if (routing.length < 9) return { status: 'incomplete' }
  if (!isValidRouting(routing)) return { status: 'invalid' }
  const district = FED_DISTRICTS[Number(routing.slice(0, 2)) % 20] || ''
  const bank = KNOWN_BANKS[routing] ?? DEMO_BANKS[Number(routing.slice(2, 5)) % DEMO_BANKS.length] ?? DEMO_BANKS[0]!
  return { status: 'verified', bank, detail: district ? `Federal Reserve district: ${district}` : 'Valid U.S. routing number' }
}

export function cardBrand(card: string) {
  if (/^4/.test(card)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(card)) return 'Mastercard'
  if (/^3[47]/.test(card)) return 'Amex'
  if (/^6(011|5)/.test(card)) return 'Discover'
  return ''
}

export function luhnValid(card: string) {
  if (!/^\d{13,19}$/.test(card)) return false
  let sum = 0
  card.split('').reverse().forEach((c, i) => { let n = Number(c); if (i % 2) { n *= 2; if (n > 9) n -= 9 } sum += n })
  return sum % 10 === 0
}

export const formatCard = (card: string) => card.replace(/(\d{4})(?=\d)/g, '$1 ')

export function formatExpiry(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

export function expiryValid(expiry: string, now = new Date()) {
  const m = /^(\d{2})\/(\d{2})$/.exec(expiry)
  if (!m) return false
  const month = Number(m[1]); const year = 2000 + Number(m[2])
  if (month < 1 || month > 12) return false
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)
}
