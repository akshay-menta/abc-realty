import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { propertiesApi } from '../api/client'
import PropertyCard from '../components/PropertyCard'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import './Listings.css'

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
const PROPERTY_TYPES = ['Single Family', 'Condo', 'Townhouse', 'Apartment', 'Commercial', 'Land']
const BEDROOM_OPTIONS = [
  { label: 'Any', value: '' },
  { label: '1+', value: '1' },
  { label: '2+', value: '2' },
  { label: '3+', value: '3' },
  { label: '4+', value: '4' },
]
const BATHROOM_OPTIONS = [
  { label: 'Any', value: '' },
  { label: '1+', value: '1' },
  { label: '2+', value: '2' },
  { label: '3+', value: '3' },
]
const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' },
]
const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
]

const EMPTY_FILTERS = {
  q: '',
  city: '',
  state: '',
  zip_code: '',
  country: 'USA',
  property_type: '',
  price_min: '',
  price_max: '',
  bedrooms_min: '',
  bathrooms_min: '',
  status: '',
  sort: 'newest',
}

function filtersFromParams(searchParams) {
  return {
    ...EMPTY_FILTERS,
    q: searchParams.get('q') || '',
    city: searchParams.get('city') || '',
    state: searchParams.get('state') || '',
    zip_code: searchParams.get('zip_code') || '',
    country: searchParams.get('country') || 'USA',
    property_type: searchParams.get('property_type') || '',
    price_min: searchParams.get('price_min') || '',
    price_max: searchParams.get('price_max') || '',
    bedrooms_min: searchParams.get('bedrooms_min') || '',
    bathrooms_min: searchParams.get('bathrooms_min') || '',
    status: searchParams.get('status') || '',
    sort: searchParams.get('sort') || 'newest',
  }
}

export default function Listings({ listingType }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [draft, setDraft] = useState(() => filtersFromParams(searchParams))
  const [applied, setApplied] = useState(() => filtersFromParams(searchParams))

  const fetchProperties = useCallback(async (page = 1, filters = applied) => {
    setLoading(true)
    try {
      const params = {
        listing_type: listingType,
        page,
        per_page: 9,
        sort: filters.sort || 'newest',
      }
      if (filters.q) params.q = filters.q
      if (filters.city) params.city = filters.city
      if (filters.state) params.state = filters.state
      if (filters.zip_code) params.zip_code = filters.zip_code
      if (filters.country) params.country = filters.country
      if (filters.property_type) params.property_type = filters.property_type
      if (filters.price_min) params.price_min = filters.price_min
      if (filters.price_max) params.price_max = filters.price_max
      if (filters.bedrooms_min) params.bedrooms_min = filters.bedrooms_min
      if (filters.bathrooms_min) params.bathrooms_min = filters.bathrooms_min
      if (filters.status) params.status = filters.status

      const res = await propertiesApi.list(params)
      setProperties(res.data.properties || [])
      setTotal(res.data.total || 0)
      setPages(res.data.pages || 1)
      setCurrentPage(page)
    } catch (err) {
      console.error(err)
      setProperties([])
      setTotal(0)
      setPages(1)
    } finally {
      setLoading(false)
    }
  }, [listingType, applied])

  useEffect(() => {
    fetchProperties(1, applied)
  }, [listingType, applied, fetchProperties])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth <= 768) setSidebarOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const setDraftField = (key, value) => {
    setDraft(f => ({ ...f, [key]: value }))
  }

  const applyFilters = (next = draft) => {
    setApplied(next)
    const params = {}
    Object.entries(next).forEach(([k, v]) => {
      if (v !== '' && v != null && !(k === 'country' && v === 'USA') && !(k === 'sort' && v === 'newest')) {
        params[k] = v
      }
    })
    setSearchParams(params)
    if (window.innerWidth <= 768) setSidebarOpen(false)
  }

  const clearFilters = () => {
    const cleared = { ...EMPTY_FILTERS }
    setDraft(cleared)
    setApplied(cleared)
    setSearchParams({})
  }

  const hasActiveFilters = Boolean(
    applied.q || applied.city || applied.state || applied.zip_code ||
    applied.property_type || applied.price_min || applied.price_max ||
    applied.bedrooms_min || applied.bathrooms_min || applied.status ||
    (applied.country && applied.country !== 'USA')
  )

  const title = listingType === 'sale' ? 'Properties for Sale' : 'Properties for Lease'
  const subtitle = listingType === 'sale'
    ? 'Find your dream home from our curated selection of premium sale listings.'
    : 'Discover flexible lease options for residential and commercial spaces.'

  return (
    <div className="listings-page page-enter">
      <div className="listings-header">
        <div className="container">
          <div className="section-label">{listingType === 'sale' ? 'For Sale' : 'For Lease'}</div>
          <h1 className="section-title">{title}</h1>
          <p className="section-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="container listings-body">
        <div className="listings-toolbar">
          <div className="results-count">
            {loading ? 'Loading...' : `${total} ${total === 1 ? 'property' : 'properties'} found`}
          </div>
          <div className="toolbar-right">
            <select
              value={applied.sort}
              onChange={e => {
                const next = { ...applied, sort: e.target.value }
                setDraft(d => ({ ...d, sort: e.target.value }))
                applyFilters(next)
              }}
              className="form-select toolbar-sort"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              type="button"
              className="btn btn-ghost btn-sm filter-toggle-btn"
              onClick={() => setSidebarOpen(o => !o)}
            >
              <SlidersHorizontal size={16} />
              Filters {hasActiveFilters && <span className="filter-dot" />}
            </button>
          </div>
        </div>

        {sidebarOpen && (
          <button
            type="button"
            className="filter-backdrop"
            aria-label="Close filters"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className={`listings-layout ${sidebarOpen ? 'filters-open' : 'filters-closed'}`}>
          <aside className={`listings-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
              <h3>Filter Properties</h3>
              <div className="sidebar-header-actions">
                {hasActiveFilters && (
                  <button type="button" className="clear-btn" onClick={clearFilters}>
                    <X size={14} /> Clear
                  </button>
                )}
                <button
                  type="button"
                  className="sidebar-close-btn"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close filters"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-section-title">Search</div>
              <div className="filter-group">
                <div className="input-with-icon">
                  <Search size={14} className="input-icon" />
                  <input
                    type="text"
                    placeholder="Property name or area..."
                    value={draft.q}
                    onChange={e => setDraftField('q', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-section-title">Status</div>
              <div className="bed-pills">
                {STATUS_OPTIONS.map(o => (
                  <button
                    type="button"
                    key={o.label}
                    className={`bed-pill ${draft.status === o.value ? 'active' : ''}`}
                    onClick={() => setDraftField('status', o.value)}
                  >{o.label}</button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-section-title">Location</div>
              <div className="filter-group">
                <label className="form-label">Country</label>
                <select
                  value={draft.country}
                  onChange={e => setDraftField('country', e.target.value)}
                  className="form-select"
                >
                  <option value="USA">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="Mexico">Mexico</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="form-label">State</label>
                <select
                  value={draft.state}
                  onChange={e => setDraftField('state', e.target.value)}
                  className="form-select"
                >
                  <option value="">All States</option>
                  {STATES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label className="form-label">City</label>
                <div className="input-with-icon">
                  <Search size={14} className="input-icon" />
                  <input
                    type="text"
                    placeholder="Search city..."
                    value={draft.city}
                    onChange={e => setDraftField('city', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="filter-group">
                <label className="form-label">ZIP Code</label>
                <input
                  type="text"
                  placeholder="e.g. 78701"
                  value={draft.zip_code}
                  onChange={e => setDraftField('zip_code', e.target.value)}
                  className="form-input"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-section-title">Price Range</div>
              <div className="price-inputs">
                <div className="filter-group">
                  <label className="form-label">Min Price</label>
                  <input
                    type="number"
                    placeholder="No min"
                    value={draft.price_min}
                    onChange={e => setDraftField('price_min', e.target.value)}
                    className="form-input"
                    min={0}
                  />
                </div>
                <div className="price-separator">—</div>
                <div className="filter-group">
                  <label className="form-label">Max Price</label>
                  <input
                    type="number"
                    placeholder="No max"
                    value={draft.price_max}
                    onChange={e => setDraftField('price_max', e.target.value)}
                    className="form-input"
                    min={0}
                  />
                </div>
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-section-title">Property Type</div>
              <div className="type-pills">
                <button
                  type="button"
                  className={`type-pill ${draft.property_type === '' ? 'active' : ''}`}
                  onClick={() => setDraftField('property_type', '')}
                >All</button>
                {PROPERTY_TYPES.map(t => (
                  <button
                    type="button"
                    key={t}
                    className={`type-pill ${draft.property_type === t ? 'active' : ''}`}
                    onClick={() => setDraftField('property_type', t)}
                  >{t}</button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-section-title">Bedrooms</div>
              <div className="bed-pills">
                {BEDROOM_OPTIONS.map(o => (
                  <button
                    type="button"
                    key={o.label}
                    className={`bed-pill ${String(draft.bedrooms_min) === String(o.value) ? 'active' : ''}`}
                    onClick={() => setDraftField('bedrooms_min', o.value)}
                  >{o.label}</button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-section-title">Bathrooms</div>
              <div className="bed-pills">
                {BATHROOM_OPTIONS.map(o => (
                  <button
                    type="button"
                    key={o.label}
                    className={`bed-pill ${String(draft.bathrooms_min) === String(o.value) ? 'active' : ''}`}
                    onClick={() => setDraftField('bathrooms_min', o.value)}
                  >{o.label}</button>
                ))}
              </div>
            </div>

            <div className="filter-actions">
              <button type="button" className="btn btn-primary filter-apply-btn" onClick={() => applyFilters(draft)}>
                Apply Filters
              </button>
            </div>
          </aside>

          <div className="listings-grid-area">
            {loading ? (
              <div className="listings-grid">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="skeleton" style={{ height: 370, borderRadius: 20 }} />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No properties found</h3>
                <p>Try adjusting your filters to see more results.</p>
                <button type="button" className="btn btn-primary" onClick={clearFilters}>Clear Filters</button>
              </div>
            ) : (
              <>
                <div className="listings-grid">
                  {properties.map(p => <PropertyCard key={p.id} property={p} />)}
                </div>
                {pages > 1 && (
                  <div className="pagination">
                    {[...Array(pages)].map((_, i) => (
                      <button
                        type="button"
                        key={i}
                        className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                        onClick={() => fetchProperties(i + 1, applied)}
                      >{i + 1}</button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}