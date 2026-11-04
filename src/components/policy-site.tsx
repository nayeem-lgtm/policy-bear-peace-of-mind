// ============= Full file contents =============

import { Link } from '@tanstack/react-router'
import { Mail, Phone, Facebook, Instagram, Linkedin, Youtube, Twitter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import logo from '@/assets/policybear-logo.asset.json'

export function PolicyHeader() {
  return <header className="site-header"><a className="skip-link" href="#main-content">Skip to content</a><div className="header-inner"><Link to="/" hash="step-state" aria-label="PolicyBear home" className="brand-link"><img src={logo.url} width="238" height="47" alt="PolicyBear" /></Link><span className="header-call-wrap"><Button asChild variant="action" className="header-call"><a href="tel:+18447652327" aria-label="Call PolicyBear at (844) 765-2327"><span className="header-call-copy"><span className="call-caption">Want To Speak Live?</span><strong>(844) POL-BEAR</strong><span className="agents-available"><span className="agent-dot" />Licensed Agents Available</span></span></a></Button></span></div></header>
}

export function PolicyFooter() {
  return <footer className="pb-footer"><div className="pb-footer-inner">
      <div className="pb-footer-seals-wrap" aria-label="Accreditation and security">
        <ul className="pb-footer-seals">
        <li><span className="seal seal-bbb" role="img" aria-label="BBB Accredited Business"><span className="seal-bbb-mark"><svg viewBox="0 0 24 32" aria-hidden="true"><path d="M12 1c3 3 4 5 1 8-2 2-3 4-1 6-4-1-6-4-4-8 1-2 3-3 4-6Zm-6 17h12l-2 3H8Zm1 5h10l-1.5 3h-7Z" fill="currentColor"/></svg><b>BBB</b></span><span className="seal-bbb-text">ACCREDITED<br />BUSINESS</span></span></li>
        <li><span className="seal seal-hitrust" role="img" aria-label="HITRUST i1 Certified"><span className="seal-hitrust-i1">i1</span><span className="seal-hitrust-text"><b>HITRUST</b><small>CERTIFIED</small></span></span></li>
        <li><span className="seal seal-geotrust" role="img" aria-label="GeoTrust Secured, powered by DigiCert"><span className="seal-geo-pill"><span className="seal-geo-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg></span><span className="seal-geo-text">GeoTrust<b>SECURED</b></span></span><small>powered by <b>digicert</b></small></span></li>
        </ul>
      </div>
      <nav className="pb-footer-links" aria-label="Final expense resources">
        <Link to="/" hash="step-state" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}>Get a quote</Link>
        <Link to="/disclaimers">Final expense disclosure</Link>
        <Link to="/licensing">Licensing</Link>
        <Link to="/privacy-policy">Privacy policy</Link>
        <Link to="/terms-conditions">Terms & conditions</Link>
        <Link to="/disclaimer">Disclaimer</Link>
        <Link to="/contact">Contact us</Link>
      </nav>
      <div className="pb-footer-connect">
        <div className="pb-footer-contact">
          <a href="mailto:support@policybear.com"><Mail aria-hidden="true" />support@policybear.com</a>
          <a href="tel:+18447652327" aria-label="Call PolicyBear at (844) 765-2327"><Phone aria-hidden="true" />(844) POL-BEAR</a>
        </div>
        <ul className="pb-footer-social" aria-label="PolicyBear on social media">
          <li><a className="social-facebook" href="https://www.facebook.com/policybearofficial/" target="_blank" rel="noopener noreferrer" aria-label="PolicyBear on Facebook"><Facebook aria-hidden="true" /></a></li>
          <li><a className="social-instagram" href="https://www.instagram.com/policybear/" target="_blank" rel="noopener noreferrer" aria-label="PolicyBear on Instagram"><Instagram aria-hidden="true" /></a></li>
          <li><a className="social-x" href="https://x.com/policybearllc" target="_blank" rel="noopener noreferrer" aria-label="PolicyBear on X"><Twitter aria-hidden="true" /></a></li>
          <li><a className="social-linkedin" href="https://www.linkedin.com/company/policy-bear" target="_blank" rel="noopener noreferrer" aria-label="PolicyBear on LinkedIn"><Linkedin aria-hidden="true" /></a></li>
          <li><a className="social-youtube" href="https://www.youtube.com/@policybearofficial" target="_blank" rel="noopener noreferrer" aria-label="PolicyBear on YouTube"><Youtube aria-hidden="true" /></a></li>
        </ul>
      </div>
    <div className="pb-footer-bottom">
      <p>© {new Date().getFullYear()} PolicyBear. All rights reserved.</p>
    </div>
  </div></footer>
}

export function SlimFooter() {
  return <footer className="pb-footer-slim"><div className="pb-footer-slim-inner">
    <p className="pb-footer-slim-copy">Copyright © {new Date().getFullYear()} PolicyBear</p>
    <nav className="pb-footer-slim-links" aria-label="Legal">
      <Link to="/terms-conditions">Terms &amp; Conditions</Link>
      <span aria-hidden="true" />
      <Link to="/privacy-policy">Privacy Policy</Link>
    </nav>
  </div></footer>
}


export function LegalPage({ title, intro, date, children }: { title: string; intro: string; date?: string; children: React.ReactNode }) {
  return <div className="policy-page"><PolicyHeader /><main id="main-content" className="legal-page"><Link to="/" hash="step-state" className="legal-back">← Back to final expense coverage</Link><span className="section-eyebrow">PolicyBear · Final expense</span><h1>{title}</h1>{date && <p className="legal-date">{date}</p>}<p className="legal-intro">{intro}</p><div className="legal-content">{children}</div></main><PolicyFooter /></div>
}
