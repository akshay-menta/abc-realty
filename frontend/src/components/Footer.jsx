import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, Share2 } from 'lucide-react'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="logo-icon">A</div>
              <div>
                <div className="logo-name" style={{color:'var(--white)'}}>ABC Realty</div>
                <div className="logo-tagline" style={{color:'var(--accent-light)'}}>Premium Properties</div>
              </div>
            </div>
            <p className="footer-desc">
              Your trusted real estate partner for buying, selling, and leasing premium properties across Texas. Excellence in every transaction.
            </p>
            <div className="social-links">
              <a href="#" className="social-btn" aria-label="Facebook">f</a>
              <a href="#" className="social-btn" aria-label="Instagram">in</a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/sale">Properties for Sale</Link></li>
              <li><Link to="/lease">Properties for Lease</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>

          {/* Property Types */}
          <div className="footer-col">
            <h4 className="footer-heading">Property Types</h4>
            <ul className="footer-links">
              <li><Link to="/sale?property_type=Single+Family">Single Family Homes</Link></li>
              <li><Link to="/sale?property_type=Condo">Condos & Lofts</Link></li>
              <li><Link to="/sale?property_type=Townhouse">Townhouses</Link></li>
              <li><Link to="/sale?property_type=Commercial">Commercial</Link></li>
              <li><Link to="/sale?property_type=Land">Land & Lots</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4 className="footer-heading">Contact Us</h4>
            <ul className="footer-contact">
              <li>
                <MapPin size={14} />
                <span>123 Realty Boulevard, Austin, TX 78701</span>
              </li>
              <li>
                <Phone size={14} />
                <a href="tel:+15125550100">(512) 555-0100</a>
              </li>
              <li>
                <Mail size={14} />
                <a href="mailto:info@abcrealty.com">info@abcrealty.com</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>© {new Date().getFullYear()} ABC Realty. All rights reserved.</p>
          <div className="footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Fair Housing</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
