import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { propertiesApi } from '../api/client'
import toast from 'react-hot-toast'
import {
  Bed, Bath, Maximize2, MapPin, Calendar, Car, Home as HomeIcon,
  CheckCircle, Phone, Mail, Send, ChevronLeft, ChevronRight,
  X, Download, ArrowUpRight, Building, ChevronDown, ChevronUp,
  Printer
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { getCoverImage } from '../utils/coverImage'

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

import './PropertyDetail.css'

function formatPrice(price, period) {
  if (!price) return 'Price on Request'
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price)
  return period ? `${formatted}${period}` : formatted
}

// Accordion section component
function AccordionSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="accordion-section">
      <button className="accordion-header" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && <div className="accordion-body">{children}</div>}
    </div>
  )
}

// Walkscore Widget
function WalkscoreWidget({ address, city, state, zip }) {
  const fullAddress = `${address} ${city} ${state} ${zip}`
  const encodedAddress = encodeURIComponent(fullAddress)
  return (
    <div className="walkscore-section">
      <div className="walkscore-link-wrap">
        <a
          href={`https://www.walkscore.com/score/${encodedAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="walkscore-link-btn"
          aria-label="Open in Walk Score"
          title="Open in Walk Score"
        >
          <ArrowUpRight size={18} />
        </a>
        <p className="walkscore-attribution">Walk Score</p>
      </div>
    </div>
  )
}

export default function PropertyDetail() {
  const { slug } = useParams()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activePhoto, setActivePhoto] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const sidebarRef = useRef(null)

  useEffect(() => {
    propertiesApi.get(slug)
      .then(res => { setProperty(res.data); document.title = `${res.data.title} | ABC Realty` })
      .catch(() => setError('Property not found'))
      .finally(() => setLoading(false))
  }, [slug])

  const handlePrevPhoto = () => setActivePhoto(p => (p - 1 + property.photos.length) % property.photos.length)
  const handleNextPhoto = () => setActivePhoto(p => (p + 1) % property.photos.length)

  useEffect(() => {
    const handleKey = (e) => {
      if (!lightboxOpen) return
      if (e.key === 'ArrowLeft') handlePrevPhoto()
      if (e.key === 'ArrowRight') handleNextPhoto()
      if (e.key === 'Escape') setLightboxOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxOpen, property])

  const submitInquiry = async (e) => {
    e.preventDefault()
    if (!inquiryForm.name || !inquiryForm.email || !inquiryForm.message) {
      toast.error('Please fill in all required fields.')
      return
    }
    setSubmitting(true)
    try {
      await propertiesApi.inquire(property.id, inquiryForm)
      toast.success("Your inquiry has been sent! We'll be in touch shortly.")
      setInquiryForm({ name: '', email: '', phone: '', message: '' })
    } catch {
      toast.error('Failed to send inquiry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="detail-loading">
      <div className="loading-spinner" />
      <p>Loading property...</p>
    </div>
  )

  if (error || !property) return (
    <div className="detail-error">
      <h2>Property Not Found</h2>
      <p>The property you're looking for doesn't exist or has been removed.</p>
      <button className="btn btn-primary" onClick={() => window.close()}>Close Tab</button>
    </div>
  )

  const photos = (property.photos && property.photos.length > 0)
    ? property.photos
    : [getCoverImage(property, 1200)]
  const highlights = property.highlights || []
  const basicInfo = property.basic_info || {}
  const documents = property.documents || []

  const statusLabel = {
    yet_to_publish: 'Draft',
    published: 'Open',
    under_contract: 'Open',
    closed: 'Closed',
  }[property.status] || (property.status === 'closed' ? 'Closed' : 'Open')

  const statusClass = property.status === 'closed' ? 'closed' : 'open'
  return (
    <div className="detail-page page-enter">

      {/* Lightbox */}
      {lightboxOpen && photos.length > 0 && (
        <div className="lightbox" onClick={() => setLightboxOpen(false)}>
          <button className="lightbox-close" onClick={() => setLightboxOpen(false)}><X size={24} /></button>
          <button className="lightbox-prev" onClick={(e) => { e.stopPropagation(); handlePrevPhoto() }}><ChevronLeft size={32} /></button>
          <img
            src={photos[activePhoto]}
            alt={`Photo ${activePhoto + 1}`}
            className="lightbox-img"
            onClick={e => e.stopPropagation()}
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200' }}
          />
          <button className="lightbox-next" onClick={(e) => { e.stopPropagation(); handleNextPhoto() }}><ChevronRight size={32} /></button>
          <div className="lightbox-counter">{activePhoto + 1} / {photos.length}</div>
        </div>
      )}

      {/* ── PAGE HEADER ───────────────────────────── */}
      <div className="detail-page-header">
        <div className="detail-page-header-inner">
          <div className="detail-title-block">
            <div className="detail-badges">
              <span className={`status-badge status-${statusClass}`}>{statusLabel}</span>
              <span className="listing-type-badge">{property.listing_type === 'sale' ? 'For Sale' : 'For Lease'}</span>
            </div>
            <h1 className="detail-h1">{property.title}</h1>
            <div className="detail-address-line">
              <MapPin size={15} />
              {property.address}, {property.city}, {property.state} {property.zip_code}
            </div>
            <div className="detail-quick-stats">
              {property.bedrooms > 0 && <span><Bed size={15} /> {property.bedrooms} BD</span>}
              {property.bathrooms > 0 && <span><Bath size={15} /> {property.bathrooms} BTH</span>}
              {property.sqft > 0 && <span><Maximize2 size={15} /> {property.sqft.toLocaleString()} SqFt</span>}
            </div>
          </div>
          <div className="detail-price-block">
            <div className="detail-big-price">{formatPrice(property.price, property.price_period)}</div>
            <div className="detail-action-btns">
              <button className="detail-action-btn" onClick={() => window.print()} title="Print Flyer">
                <Printer size={16} /> Print Flyer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── GALLERY + SIDEBAR GRID ─────────────────── */}
      <div className="detail-main-grid">

        {/* LEFT: Gallery + Content */}
        <div className="detail-left">

          {/* Photo Gallery */}
          <div className="gallery-section">
            {photos.length > 0 ? (
              <div className="gallery-grid">
                <div className="gallery-main" onClick={() => { setActivePhoto(0); setLightboxOpen(true) }}>
                  <img
                    src={photos[0]}
                    alt="Main"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200' }}
                  />
                  <div className="gallery-main-overlay">
                    <span>1 / {photos.length}</span>
                  </div>
                </div>
                <div className="gallery-thumbs">
                  {photos.slice(1, 5).map((p, i) => (
                    <div key={i} className="gallery-thumb" onClick={() => { setActivePhoto(i + 1); setLightboxOpen(true) }}>
                      <img
                        src={p}
                        alt={`Photo ${i + 2}`}
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400' }}
                      />
                      {i === 3 && photos.length > 5 && (
                        <div className="gallery-more-overlay">+{photos.length - 5} more</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="gallery-placeholder"><HomeIcon size={48} /><p>No photos available</p></div>
            )}
            {photos.length > 0 && (
              <button className="view-all-photos-btn" onClick={() => setLightboxOpen(true)}>
                📷 View All {photos.length} Photos
              </button>
            )}
          </div>

          {/* Quick Specs Bar */}
          <div className="detail-specs-bar">
            {property.bedrooms > 0 && <div className="spec-bar-item"><Bed size={20} /><span className="spec-bar-val">{property.bedrooms}</span><span className="spec-bar-lbl">Bedrooms</span></div>}
            {property.bathrooms > 0 && <div className="spec-bar-item"><Bath size={20} /><span className="spec-bar-val">{property.bathrooms}</span><span className="spec-bar-lbl">Bathrooms</span></div>}
            {property.sqft > 0 && <div className="spec-bar-item"><Maximize2 size={20} /><span className="spec-bar-val">{property.sqft.toLocaleString()}</span><span className="spec-bar-lbl">Sq Ft</span></div>}
            {property.garage > 0 && <div className="spec-bar-item"><Car size={20} /><span className="spec-bar-val">{property.garage}</span><span className="spec-bar-lbl">Garage</span></div>}
            {property.year_built > 0 && <div className="spec-bar-item"><Calendar size={20} /><span className="spec-bar-val">{property.year_built}</span><span className="spec-bar-lbl">Year Built</span></div>}
            {property.lot_size && <div className="spec-bar-item"><Building size={20} /><span className="spec-bar-val">{property.lot_size}</span><span className="spec-bar-lbl">Lot Size</span></div>}
          </div>

          {/* Description */}
          {property.description && (
            <AccordionSection title="About This Property" defaultOpen={true}>
              <p className="detail-description">{property.description}</p>
            </AccordionSection>
          )}

          {/* Highlights */}
          {highlights.length > 0 && (
            <AccordionSection title="Property Highlights" defaultOpen={true}>
              <div className="highlights-grid">
                {highlights.map((h, i) => (
                  <div key={i} className="highlight-item">
                    <CheckCircle size={15} />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </AccordionSection>
          )}

          {/* Basic Info */}
          {Object.keys(basicInfo).length > 0 && (
            <AccordionSection title="Basic Information" defaultOpen={true}>
              <div className="basic-info-grid">
                {/* Always-shown core details */}
                {property.property_type && (
                  <div className="info-row"><div className="info-key">Property Type</div><div className="info-val">{property.property_type}</div></div>
                )}
                {property.listing_type && (
                  <div className="info-row"><div className="info-key">Listing Type</div><div className="info-val">{property.listing_type === 'sale' ? 'For Sale' : 'For Lease'}</div></div>
                )}
                {property.year_built > 0 && (
                  <div className="info-row"><div className="info-key">Year Built</div><div className="info-val">{property.year_built}</div></div>
                )}
                {property.sqft > 0 && (
                  <div className="info-row"><div className="info-key">Square Feet</div><div className="info-val">{property.sqft.toLocaleString()}</div></div>
                )}
                {property.lot_size && (
                  <div className="info-row"><div className="info-key">Lot Size</div><div className="info-val">{property.lot_size}</div></div>
                )}
                {property.garage > 0 && (
                  <div className="info-row"><div className="info-key">Garage</div><div className="info-val">{property.garage} car</div></div>
                )}
                {/* Extra basic_info fields from admin */}
                {Object.entries(basicInfo).map(([key, val]) => (
                  <div key={key} className="info-row">
                    <div className="info-key">{key}</div>
                    <div className="info-val">{val}</div>
                  </div>
                ))}
              </div>
            </AccordionSection>
          )}

          {/* Location / Map */}
          {property.latitude && property.longitude && (
            <AccordionSection title="Location & Map" defaultOpen={true}>
              <div className="map-container" style={{ height: '380px', borderRadius: '12px', overflow: 'hidden' }}>
                <MapContainer 
                  center={[property.latitude, property.longitude]} 
                  zoom={15} 
                  style={{ height: '100%', width: '100%', zIndex: 1 }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[property.latitude, property.longitude]}>
                    <Popup>
                      <b>{property.title}</b><br/>
                      {property.address}, {property.city}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
              <p className="map-footer">
                <MapPin size={13} />
                {property.address}, {property.city}, {property.state} {property.zip_code}
                <a
                  href={`https://www.openstreetmap.org/?mlat=${property.latitude}&mlon=${property.longitude}#map=16/${property.latitude}/${property.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-link"
                >
                  <ArrowUpRight size={13} /> Open in OpenStreetMap
                </a>
              </p>
            </AccordionSection>
          )}

          {/* Walkscore */}
          <AccordionSection title="Walk Score" defaultOpen={true}>
            <WalkscoreWidget
              address={property.address}
              city={property.city}
              state={property.state}
              zip={property.zip_code}
            />
          </AccordionSection>

          {/* Documents */}
          {documents.length > 0 && (
            <AccordionSection title="Documents">
              <div className="documents-list">
                {documents.map((doc, i) => (
                  <a
                    key={i}
                    href={typeof doc === 'string' ? doc : doc.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="document-item"
                  >
                    <Download size={16} />
                    <span>{typeof doc === 'string' ? `Document ${i + 1}` : doc.name}</span>
                  </a>
                ))}
              </div>
            </AccordionSection>
          )}

        </div>

        {/* RIGHT: Sticky Sidebar */}
        <div className="detail-sidebar" ref={sidebarRef}>

          {/* Agent Card */}
          <div className="agent-contact-card">
            <div className="agent-card-header">
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&h=120&fit=crop&crop=face"
                alt="Agent"
                className="agent-photo"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
              <div className="agent-photo-fallback">
                {(property.contact_name || 'A').charAt(0)}
              </div>
              <div className="agent-card-info">
                <div className="agent-card-name">{property.contact_name || 'ABC Realty Agent'}</div>
                <div className="agent-card-role">Licensed Real Estate Agent</div>
                <div className="agent-card-company">ABC Realty</div>
              </div>
            </div>

            <div className="agent-cta-btns">
              {property.contact_phone && (
                <a href={`tel:${property.contact_phone}`} className="agent-cta phone">
                  <Phone size={16} /> {property.contact_phone}
                </a>
              )}
              {property.contact_email && (
                <a href={`mailto:${property.contact_email}`} className="agent-cta email">
                  <Mail size={16} /> Email Agent
                </a>
              )}
            </div>

            <div className="inquiry-divider">YOUR CONTACT INFORMATION</div>
            <form onSubmit={submitInquiry} className="inquiry-form">
              <div className="inquiry-row-2">
                <input
                  type="text"
                  placeholder="First Name *"
                  value={inquiryForm.name}
                  onChange={e => setInquiryForm(f => ({ ...f, name: e.target.value }))}
                  className="form-input"
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={inquiryForm.email}
                  onChange={e => setInquiryForm(f => ({ ...f, email: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>
              <input
                type="tel"
                placeholder="Phone"
                value={inquiryForm.phone}
                onChange={e => setInquiryForm(f => ({ ...f, phone: e.target.value }))}
                className="form-input"
              />
              <textarea
                placeholder={`I'm interested in ${property.title}. Please contact me with more details.`}
                value={inquiryForm.message}
                onChange={e => setInquiryForm(f => ({ ...f, message: e.target.value }))}
                className="form-textarea"
                rows={4}
                required
              />
              <button type="submit" className="btn btn-primary w-full inquiry-submit" disabled={submitting}>
                <Send size={16} />
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Quick Facts Card */}
          <div className="quick-facts-card">
            <h4 className="quick-facts-title">Property Summary</h4>
            <ul className="quick-facts-list">
              <li><span>Status</span><span className={`qf-status status-${statusClass}`}>{statusLabel}</span></li>
              <li><span>Type</span><span>{property.property_type}</span></li>
              <li><span>Listing</span><span>{property.listing_type === 'sale' ? 'For Sale' : 'For Lease'}</span></li>
              {property.year_built > 0 && <li><span>Year Built</span><span>{property.year_built}</span></li>}
              {property.sqft > 0 && <li><span>Size</span><span>{property.sqft.toLocaleString()} sqft</span></li>}
              {property.lot_size && <li><span>Lot Size</span><span>{property.lot_size}</span></li>}
              {property.garage > 0 && <li><span>Garage</span><span>{property.garage} car</span></li>}
              <li><span>City</span><span>{property.city}</span></li>
              <li><span>State</span><span>{property.state}</span></li>
              <li><span>ZIP</span><span>{property.zip_code}</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
