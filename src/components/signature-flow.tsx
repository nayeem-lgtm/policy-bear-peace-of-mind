import { useState } from 'react'
import { Check, FileText, Mail, MessageSquare, PenLine } from 'lucide-react'
import * as Radio from '@radix-ui/react-radio-group'
import * as Checkbox from '@radix-ui/react-checkbox'
import { Button } from '@/components/ui/button'
import bearLogo from '@/assets/policybear-logo.asset.json'

export type PinDelivery = 'Email' | 'Text Message' | ''
type Props = {
  stage: 'delivery' | 'authorize'; delivery: PinDelivery; onDelivery: (value: PinDelivery) => void
  onConfirm: () => void; onAnotherWay: () => void; onSign: () => void
  name: string; email: string; phone: string; address: string; beneficiary: string
  coverage: number; monthly: number; paymentMethod: string
}

export function SignatureFlow(props: Props) {
  const [pin, setPin] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [document, setDocument] = useState('Application')
  const [resent, setResent] = useState(false)
  const authorizing = props.stage === 'authorize'
  const destination = props.delivery === 'Email' ? props.email : props.phone ? `(***) ***-${props.phone.replace(/\D/g, '').slice(-4)}` : ''
  const available = Boolean(props.delivery && destination)
  return <div className="sign-flow">
    <ol className="sign-stepper" aria-label="Signature progress"><li className={authorizing ? 'complete' : 'current'} aria-current={!authorizing ? 'step' : undefined}><span>{authorizing ? <Check /> : '1'}</span>Choose PIN delivery method</li><li className={authorizing ? 'current' : ''} aria-current={authorizing ? 'step' : undefined}><span>2</span>Authorize Signature</li></ol>
    {!authorizing ? <div className="sign-delivery">
      <h3>Send application documents for signature</h3>
      <p className="sign-intro">{props.name || 'The insured person'} will review the application and authorization forms before signing.</p>
      <h4>Choose PIN delivery method</h4>
      <Radio.Root aria-label="PIN delivery method" value={props.delivery} onValueChange={(value) => props.onDelivery(value as PinDelivery)} className="identity-choices sign-delivery-choices">
        {(['Email', 'Text Message'] as const).map((method) => <Radio.Item key={method} value={method} className="identity-choice"><span className="sign-choice-icon">{method === 'Email' ? <Mail /> : <MessageSquare />}</span><strong>{method}</strong></Radio.Item>)}
      </Radio.Root>
      {props.delivery && <p className="sign-destination">{destination || `Please add your ${props.delivery === 'Email' ? 'email address' : 'mobile number'} in contact details.`}</p>}
      <Button type="button" variant="action" className="revisit-next sign-primary" disabled={!available} onClick={props.onConfirm}>Confirm and send documents</Button>
      <p className="sign-demo-note">Preview only — no email or text message is sent.</p>
    </div> : <div className="sign-authorize-layout">
      <section className="sign-document-view" aria-label="Review document">
        <div className="sign-document-toolbar"><span><FileText />Review Document</span><select aria-label="Document to review" value={document} onChange={(event) => setDocument(event.target.value)}>{['Application', 'Authorizations', 'Payment authorization'].map((value) => <option key={value}>{value}</option>)}</select></div>
        <article className="sign-document-paper">
          <img src={bearLogo.url} alt="PolicyBear" width="150" height="30" />
          <p className="sign-document-caption">Final Expense · Application preview</p>
          <h3>{document === 'Application' ? 'Application for individual life insurance' : document}</h3>
          {document === 'Application' ? <><h4>Proposed insured</h4><dl><div><dt>Full legal name</dt><dd>{props.name || 'Not provided'}</dd></div><div><dt>Home address</dt><dd>{props.address || 'Not provided'}</dd></div><div><dt>Email address</dt><dd>{props.email || 'Not provided'}</dd></div><div><dt>Phone number</dt><dd>{props.phone || 'Not provided'}</dd></div></dl><h4>Coverage</h4><dl><div><dt>Plan</dt><dd>PolicyBear Final Expense</dd></div><div><dt>Coverage amount</dt><dd>${props.coverage.toLocaleString()}</dd></div><div><dt>Monthly premium</dt><dd>${props.monthly.toFixed(2)}</dd></div><div><dt>Primary beneficiary</dt><dd>{props.beneficiary || 'Not provided'}</dd></div></dl></> : document === 'Authorizations' ? <><h4>Electronic signature consent</h4><p>I have had the opportunity to review my application and agree to use an electronic signature.</p><h4>Accuracy of application</h4><p>I confirm that my answers are complete and accurate to the best of my knowledge.</p></> : <><h4>Payment details</h4><dl><div><dt>Payment method</dt><dd>{props.paymentMethod}</dd></div><div><dt>Monthly amount</dt><dd>${props.monthly.toFixed(2)}</dd></div></dl><p>No transaction has been processed. Sensitive payment information is not included in this preview.</p></>}
          <footer>Preview document · Not a carrier-issued application</footer>
        </article>
      </section>
      <section className="sign-authorization" aria-label="Authorize Signature">
        <h3>Authorize Signature</h3>
        <div className="sign-consent-copy"><h4><PenLine />Signature authorization</h4><p>By providing your PIN, you agree to electronically sign your application and its associated authorizations and disclosures.</p><ul><li>I have received and had the opportunity to review the documents.</li><li>My application answers are complete and accurate to the best of my knowledge.</li><li>I agree to use an electronic signature in place of a handwritten signature.</li></ul></div>
        <label className="sign-agreement"><Checkbox.Root checked={agreed} onCheckedChange={(value) => setAgreed(value === true)} aria-label="I have reviewed the documents and agree to sign electronically"><Checkbox.Indicator><Check /></Checkbox.Indicator></Checkbox.Root><span>I have reviewed the documents and agree to sign electronically.</span></label>
        <div className="sign-pin-panel"><div className="sign-pin-heading"><strong>Enter PIN Code</strong><Button variant="quiet" type="button" onClick={props.onAnotherWay}>Send Another Way</Button></div><p className="sign-pin-destination">{props.delivery || 'PIN'} · {destination || 'Choose a delivery method'}</p><label className="contact-tile"><span className="contact-tile-label">PIN Code</span><input aria-label="PIN Code" value={pin} onChange={(event) => { setPin(event.target.value.replace(/\D/g, '').slice(0, 6)); setResent(false) }} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="Enter PIN" /></label><div className="sign-resend"><span>{resent ? 'PIN preview refreshed.' : 'Didn’t receive your PIN?'}</span><Button variant="quiet" type="button" onClick={() => { setPin(''); setResent(true) }}>Resend</Button></div><p className="sign-demo-note">Preview only — no PIN is sent. Any 6-digit PIN completes this preview.</p></div>
        <Button type="button" variant="action" className="revisit-next sign-primary" disabled={!agreed || pin.length !== 6 || !available} onClick={props.onSign}>Agree and sign documents</Button>
      </section>
    </div>}
  </div>
}