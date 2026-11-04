import { useEffect, useId, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { addressDetails, startAddressSession, suggestAddresses } from '@/lib/address-lookup.functions'

export type AddressPick = { street: string; apt: string; city: string; stateCode: string; zip: string }
type Suggestion = { placeId: string; main: string; secondary: string }

let guestToken: { value: string; expires: number } | null = null
async function getGuestToken() {
  if (guestToken && guestToken.expires - Date.now() > 60_000) return guestToken.value
  const { token } = await startAddressSession()
  guestToken = { value: token, expires: Number(token.split('.')[0]) }
  return token
}

export function AddressAutocomplete({ value, onChange, onPick }: { value: string; onChange: (value: string) => void; onPick: (pick: AddressPick) => void }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const sessionToken = useRef<string>('')
  const requestId = useRef(0)
  const skipNext = useRef(false)
  const listId = useId()

  useEffect(() => {
    if (skipNext.current) { skipNext.current = false; return }
    const query = value.trim()
    if (query.length < 3) { setSuggestions([]); return }
    const id = ++requestId.current
    const timer = window.setTimeout(async () => {
      try {
        if (!sessionToken.current) sessionToken.current = crypto.randomUUID()
        const token = await getGuestToken()
        const results = await suggestAddresses({ data: { token, sessionToken: sessionToken.current, input: query.slice(0, 120) } })
        if (id !== requestId.current) return
        setSuggestions(results); setActive(-1); setOpen(true)
      } catch {
        if (id === requestId.current) setSuggestions([])
      }
    }, 300)
    return () => window.clearTimeout(timer)
  }, [value])

  const pick = async (suggestion: Suggestion) => {
    setOpen(false); setSuggestions([])
    skipNext.current = true
    onChange(suggestion.main)
    try {
      const token = await getGuestToken()
      const details = await addressDetails({ data: { token, sessionToken: sessionToken.current || crypto.randomUUID(), placeId: suggestion.placeId } })
      skipNext.current = true
      onPick(details)
    } catch {
      // Keep the typed street; customer can finish the fields manually.
    } finally {
      sessionToken.current = ''
    }
  }

  const showList = open && suggestions.length > 0
  return <div className="address-autocomplete">
    <label className={`contact-tile${value ? ' is-filled' : ''}`}>
      <span className="contact-tile-label">Street address<span className="contact-required" aria-hidden="true"> *</span></span>
      <input name="street" aria-label="Street address" required autoComplete="off" placeholder="Start typing your address" maxLength={100} value={value}
        role="combobox" aria-expanded={showList} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => suggestions.length && setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={(event) => {
          if (!showList) return
          if (event.key === 'ArrowDown') { event.preventDefault(); setActive((i) => (i + 1) % suggestions.length) }
          else if (event.key === 'ArrowUp') { event.preventDefault(); setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1)) }
          else if (event.key === 'Enter' && active >= 0) { event.preventDefault(); void pick(suggestions[active]) }
          else if (event.key === 'Escape') setOpen(false)
        }} />
    </label>
    {showList && <ul className="address-suggestions" id={listId} role="listbox" aria-label="Address suggestions">
      {suggestions.map((suggestion, index) => <li key={suggestion.placeId} id={`${listId}-${index}`} role="option" aria-selected={index === active} className={index === active ? 'is-active' : undefined}
        onMouseDown={(event) => { event.preventDefault(); void pick(suggestion) }} onMouseEnter={() => setActive(index)}>
        <MapPin aria-hidden="true" /><span><strong>{suggestion.main}</strong><small>{suggestion.secondary}</small></span>
      </li>)}
      <li className="address-suggestions-credit" aria-hidden="true">powered by Google</li>
    </ul>}
  </div>
}
