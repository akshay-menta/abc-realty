import { Bed, Bath, Maximize2, MapPin, Calendar } from 'lucide-react'
import { publicStatusLabel, publicStatusClass } from '../utils/status'
import { getCoverImage, DEFAULT_PLACEHOLDER } from '../utils/coverImage'
import './PropertyCard.css'

function formatPrice(price, period) {
  if (!price) return 'Price on Request'
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(price)
  return period ? `${formatted}${period}` : formatted
}

export default function PropertyCard({ property, onClick }) {
  const coverPhoto = getCoverImage(property, 600)
  const statusKey = publicStatusClass(property.status)
  const hasRealPhoto = Array.isArray(property.photos) && property.photos.length > 0

  const handleClick = () => {
    if (onClick) return onClick(property)
    window.open(`/property/${property.slug}`, '_blank')
  }

  return (
    <div className="prop-card" onClick={handleClick}>
      <div className="prop-card-img-wrap">
        <img
          src={coverPhoto}
          alt={property.title}
          className="prop-card-img"
          loading="lazy"
          onError={(e) => { e.target.src = DEFAULT_PLACEHOLDER }}
        />
        <div className="prop-card-badges">
          <span className={`status-badge status-${statusKey}`}>
            {publicStatusLabel(property.status)}
          </span>
        </div>
        <div className="prop-card-type-badge">
          {property.listing_type === 'sale' ? 'For Sale' : 'For Lease'}
        </div>
        {hasRealPhoto && property.photos.length > 1 && (
          <div className="prop-card-photo-count">
            📷 {property.photos.length}
          </div>
        )}
      </div>

      <div className="prop-card-body">
        <div className="prop-card-price">{formatPrice(property.price, property.price_period)}</div>
        <h3 className="prop-card-title">{property.title}</h3>
        <div className="prop-card-location">
          <MapPin size={13} />
          <span>{property.address ? `${property.address}, ` : ''}{property.city}, {property.state} {property.zip_code}</span>
        </div>

        <div className="prop-card-specs">
          {property.bedrooms > 0 && (
            <div className="spec-item">
              <Bed size={14} />
              <span>{property.bedrooms} Beds</span>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="spec-item">
              <Bath size={14} />
              <span>{property.bathrooms} Baths</span>
            </div>
          )}
          {property.sqft > 0 && (
            <div className="spec-item">
              <Maximize2 size={14} />
              <span>{property.sqft.toLocaleString()} sqft</span>
            </div>
          )}
        </div>

        <div className="prop-card-footer">
          <span className="prop-card-prop-type">{property.property_type}</span>
          {property.year_built > 0 && (
            <span className="prop-card-year">
              <Calendar size={12} /> {property.year_built}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
