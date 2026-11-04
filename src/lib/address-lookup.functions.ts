import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_maps'
const SESSION_MINUTES = 30

const encoder = new TextEncoder()
const toHex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('')

async function sign(payload: string) {
  const secret = process.env.ADDRESS_SESSION_SECRET
  if (!secret) throw new Error('Address lookup is not configured.')
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)))
}

async function verifyGuestSession(token: string) {
  const [expires, signature] = token.split('.')
  if (!expires || !signature || !/^\d+$/.test(expires) || Number(expires) < Date.now()) throw new Error('Address lookup session expired.')
  const expected = await sign(expires)
  if (expected.length !== signature.length) throw new Error('Invalid address lookup session.')
  let diff = 0
  for (let i = 0; i < expected.length; i += 1) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  if (diff !== 0) throw new Error('Invalid address lookup session.')
}

function credentials() {
  const lovableKey = process.env.LOVABLE_API_KEY
  const mapsKey = process.env.GOOGLE_MAPS_API_KEY
  if (!lovableKey || !mapsKey) throw new Error('Address lookup is not configured.')
  return { Authorization: `Bearer ${lovableKey}`, 'X-Connection-Api-Key': mapsKey }
}

async function readGatewayError(response: Response) {
  const body = await response.text()
  console.error(`Address lookup failed [${response.status}]: ${body}`)
  if (response.status === 403) return new Error('Address suggestions are not allowed for this Google Maps key.')
  return new Error(`Address lookup failed [${response.status}]`)
}

/** Issues a short-lived signed guest session; address lookups require it. */
export const startAddressSession = createServerFn({ method: 'POST' }).handler(async () => {
  const expires = String(Date.now() + SESSION_MINUTES * 60_000)
  return { token: `${expires}.${await sign(expires)}` }
})

const suggestInput = z.object({
  token: z.string().min(10).max(200),
  sessionToken: z.string().uuid(),
  input: z.string().trim().min(3).max(120),
})

export const suggestAddresses = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => suggestInput.parse(data))
  .handler(async ({ data }) => {
    await verifyGuestSession(data.token)
    const response = await fetch(`${GATEWAY_URL}/places/v1/places:autocomplete`, {
      method: 'POST',
      headers: { ...credentials(), 'Content-Type': 'application/json', 'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat' },
      body: JSON.stringify({ input: data.input, sessionToken: data.sessionToken, includedRegionCodes: ['us'], includedPrimaryTypes: ['street_address', 'premise', 'subpremise'] }),
    })
    if (!response.ok) throw await readGatewayError(response)
    const json = (await response.json()) as { suggestions?: Array<{ placePrediction?: { placeId?: string; structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } } } }> }
    return (json.suggestions ?? []).flatMap((item) => {
      const prediction = item.placePrediction
      if (!prediction?.placeId) return []
      return [{ placeId: prediction.placeId, main: prediction.structuredFormat?.mainText?.text ?? '', secondary: prediction.structuredFormat?.secondaryText?.text ?? '' }]
    }).slice(0, 5)
  })

const detailsInput = z.object({
  token: z.string().min(10).max(200),
  sessionToken: z.string().uuid(),
  placeId: z.string().regex(/^[A-Za-z0-9_-]{10,300}$/),
})

export const addressDetails = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => detailsInput.parse(data))
  .handler(async ({ data }) => {
    await verifyGuestSession(data.token)
    const response = await fetch(`${GATEWAY_URL}/places/v1/places/${data.placeId}?sessionToken=${encodeURIComponent(data.sessionToken)}`, {
      headers: { ...credentials(), 'X-Goog-FieldMask': 'addressComponents' },
    })
    if (!response.ok) throw await readGatewayError(response)
    const json = (await response.json()) as { addressComponents?: Array<{ longText?: string; shortText?: string; types?: string[] }> }
    const find = (type: string) => json.addressComponents?.find((component) => component.types?.includes(type))
    const street = [find('street_number')?.longText, find('route')?.shortText].filter(Boolean).join(' ')
    return {
      street,
      apt: find('subpremise')?.longText ?? '',
      city: find('locality')?.longText ?? find('postal_town')?.longText ?? find('sublocality')?.longText ?? find('administrative_area_level_3')?.longText ?? '',
      stateCode: find('administrative_area_level_1')?.shortText ?? '',
      zip: find('postal_code')?.longText ?? '',
    }
  })
