import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { propertiesApi } from '../api/client'
import PropertyCard from '../components/PropertyCard'
import { Search, MapPin, TrendingUp, Home as HomeIcon, Key, Star, ArrowRight, ChevronDown, Award, Users, Building } from 'lucide-react'
import { getCoverImage } from '../utils/coverImage'
import './Home.css'

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

const TESTIMONIALS = [
  { name: 'Michael & Sarah Thompson', text: 'ABC Realty found us our dream home in Austin in under 3 weeks. Their attention to detail and market expertise is unmatched.', rating: 5, location: 'Austin, TX' },
  { name: 'Jennifer Liu', text: "As an investor, I've worked with many realtors. ABC Realty stands out for their professionalism, responsiveness, and genuine care for clients.", rating: 5, location: 'Dallas, TX' },
  { name: 'Robert Castillo', text: 'Sold my property above asking price within days. The team at ABC Realty truly delivers results. Highly recommend!', rating: 5, location: 'San Antonio, TX' },
]

function useCountUp(target, duration = 2000, started = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!started) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration, started])
  return count
}

export default function Home() {
  const navigate = useNavigate()
  const [saleProps, setSaleProps] = useState([])
  const [leaseProps, setLeaseProps] = useState([])
  const [loading, setLoading] = useState(true)
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef(null)

  // Quick search state
  const [search, setSearch] = useState({ listing_type: 'sale', city: '', state: '', zip_code: '' })

  const sales = useCountUp(247, 2000, statsVisible)
  const years  = useCountUp(12, 1500, statsVisible)
  const cities = useCountUp(18, 1800, statsVisible)
  const volume = useCountUp(95, 2200, statsVisible)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true) },
      { threshold: 0.3 }
    )
    if (statsRef.current) observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    Promise.all([
      propertiesApi.list({ listing_type: 'sale', per_page: 3, status: 'published' }),
      propertiesApi.list({ listing_type: 'lease', per_page: 3, status: 'published' }),
    ]).then(([saleRes, leaseRes]) => {
      setSaleProps(saleRes.data.properties)
      setLeaseProps(leaseRes.data.properties)
    }).finally(() => setLoading(false))
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search.city) params.set('city', search.city)
    if (search.state) params.set('state', search.state)
    if (search.zip_code) params.set('zip_code', search.zip_code)
    navigate(`/${search.listing_type}?${params.toString()}`)
  }

  return (
    <div className="home-page page-enter">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1800&q=80"
            alt="Luxury home"
            className="hero-img"
          />
          <div className="hero-overlay" />
        </div>

        <div className="container hero-content">
          <div className="hero-text animate-fade-up">
            <div className="hero-eyebrow">
              <span className="hero-badge">🏆 #1 Rated Realty in Texas</span>
            </div>
            <h1 className="hero-title">
              Find Your Perfect<br />
              <span className="hero-accent">Dream Home</span>
            </h1>
            <p className="hero-subtitle">
              Premium properties for sale and lease across Texas. Let ABC Realty guide you to your next chapter.
            </p>
            <div className="hero-ctas">
              <Link to="/sale" className="btn btn-primary btn-lg">
                <HomeIcon size={18} /> Browse For Sale
              </Link>
              <Link to="/lease" className="btn btn-outline btn-lg">
                <Key size={18} /> Browse For Lease
              </Link>
            </div>
          </div>

          {/* Quick Search */}
          <div className="hero-search animate-fade-up delay-200">
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-tabs">
                <button
                  type="button"
                  className={`search-tab ${search.listing_type === 'sale' ? 'active' : ''}`}
                  onClick={() => setSearch(s => ({ ...s, listing_type: 'sale' }))}
                >For Sale</button>
                <button
                  type="button"
                  className={`search-tab ${search.listing_type === 'lease' ? 'active' : ''}`}
                  onClick={() => setSearch(s => ({ ...s, listing_type: 'lease' }))}
                >For Lease</button>
              </div>
              <div className="search-inputs">
                <div className="search-input-group">
                  <MapPin size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="City (e.g., Austin)"
                    value={search.city}
                    onChange={e => setSearch(s => ({ ...s, city: e.target.value }))}
                    className="search-input"
                  />
                </div>
                <div className="search-input-group">
                  <select
                    value={search.state}
                    onChange={e => setSearch(s => ({ ...s, state: e.target.value }))}
                    className="search-input search-select"
                  >
                    <option value="">State</option>
                    {STATES.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div className="search-input-group">
                  <input
                    type="text"
                    placeholder="ZIP Code"
                    value={search.zip_code}
                    onChange={e => setSearch(s => ({ ...s, zip_code: e.target.value }))}
                    className="search-input"
                    maxLength={10}
                  />
                </div>
                <button type="submit" className="search-btn">
                  <Search size={18} /> Search
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="hero-scroll">
          <ChevronDown size={24} />
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <section className="stats-section" ref={statsRef}>
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">{sales}+</div>
              <div className="stat-label">Properties Sold</div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="stat-number">{years}</div>
              <div className="stat-label">Years of Excellence</div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="stat-number">{cities}</div>
              <div className="stat-label">Cities Served</div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="stat-number">${volume}M+</div>
              <div className="stat-label">Volume Closed</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────────────── */}
      <section className="section about-section">
        <div className="container about-grid">
          <div className="about-images">
            <div className="about-img-main">
              <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80" alt="Our team" />
            </div>
            <div className="about-img-secondary">
              <img src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&q=80" alt="Meeting" />
            </div>
            <div className="about-years-badge">
              <div className="about-years-num">12</div>
              <div className="about-years-text">Years<br/>of Trust</div>
            </div>
          </div>

          <div className="about-content">
            <div className="section-label">About ABC Realty</div>
            <h2 className="section-title">Your Trusted Partner in Real Estate</h2>
            <div className="divider" />
            <p className="about-text">
              At ABC Realty, we believe finding the right property is one of life's most significant milestones. 
              With over 12 years of experience in the Texas market, our team of dedicated agents brings unparalleled 
              expertise, integrity, and passion to every transaction.
            </p>
            <p className="about-text">
              Whether you're buying your first home, expanding your investment portfolio, or finding the perfect 
              commercial space, we're here to make it happen — seamlessly, transparently, and with results that exceed expectations.
            </p>
            <div className="about-features">
              <div className="about-feature">
                <div className="feature-icon"><Award size={20} /></div>
                <div>
                  <div className="feature-title">Award-Winning Service</div>
                  <div className="feature-desc">Recognized as top realtors in Texas</div>
                </div>
              </div>
              <div className="about-feature">
                <div className="feature-icon"><Users size={20} /></div>
                <div>
                  <div className="feature-title">Client-First Philosophy</div>
                  <div className="feature-desc">Your goals are our priority, always</div>
                </div>
              </div>
              <div className="about-feature">
                <div className="feature-icon"><Building size={20} /></div>
                <div>
                  <div className="feature-title">Full Portfolio</div>
                  <div className="feature-desc">Residential, commercial & investment</div>
                </div>
              </div>
            </div>
            <Link to="/contact" className="btn btn-dark">
              Meet Our Team <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured For Sale ─────────────────────────────────────────── */}
      <section className="section featured-section featured-sale">
        <div className="container">
          <div className="featured-header">
            <div>
              <div className="section-label">Available Now</div>
              <h2 className="section-title">Featured Properties for Sale</h2>
            </div>
            <Link to="/sale" className="btn btn-ghost">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid-3">
            {loading
              ? [1,2,3].map(i => <div key={i} className="skeleton" style={{height:380, borderRadius:20}} />)
              : saleProps.map(p => <PropertyCard key={p.id} property={p} />)
            }
          </div>
        </div>
      </section>

      {/* ── CTA Banner (For Lease) ────────────────────────────────────── */}
      <section className="lease-cta-section">
        <div className="container lease-cta-inner">
          <div className="lease-cta-content">
            <div className="section-label" style={{color:'var(--accent-light)'}}>Flexible Living</div>
            <h2 className="section-title" style={{color:'var(--white)'}}>Find Your Perfect Rental</h2>
            <p style={{color:'rgba(255,255,255,0.75)', fontSize:16, lineHeight:1.7, maxWidth:500}}>
              From urban lofts to spacious suburban homes, we have lease options to suit every lifestyle and budget.
            </p>
            <Link to="/lease" className="btn btn-primary btn-lg" style={{marginTop:'var(--space-lg)'}}>
              <Key size={18} /> Browse Lease Properties
            </Link>
          </div>
          <div className="lease-cta-cards">
            {leaseProps.slice(0, 2).map(p => (
              <div key={p.id} className="lease-mini-card" onClick={() => window.open(`/property/${p.slug}`, '_blank')}>
                <img src={getCoverImage(p, 400)} alt={p.title} />
                <div className="lease-mini-info">
                  <div className="lease-mini-price">${p.price?.toLocaleString()}{p.price_period}</div>
                  <div className="lease-mini-title">{p.title}</div>
                  <div className="lease-mini-loc"><MapPin size={12}/>{p.city}, {p.state}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured For Lease ────────────────────────────────────────── */}
      <section className="section featured-section">
        <div className="container">
          <div className="featured-header">
            <div>
              <div className="section-label">For Lease</div>
              <h2 className="section-title">Latest Rental Listings</h2>
            </div>
            <Link to="/lease" className="btn btn-ghost">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid-3">
            {loading
              ? [1,2,3].map(i => <div key={i} className="skeleton" style={{height:380, borderRadius:20}} />)
              : leaseProps.map(p => <PropertyCard key={p.id} property={p} />)
            }
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────── */}
      <section className="section testimonials-section">
        <div className="container">
          <div className="text-center" style={{marginBottom:'var(--space-2xl)'}}>
            <div className="section-label">Client Stories</div>
            <h2 className="section-title">What Our Clients Say</h2>
            <div className="divider divider-center" />
          </div>
          <div className="grid-3">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="testimonial-card animate-fade-up" style={{animationDelay: `${i*100}ms`}}>
                <div className="testimonial-stars">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-loc"><MapPin size={12} />{t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="final-cta-section">
        <div className="container text-center">
          <h2 className="final-cta-title">Ready to Find Your Next Property?</h2>
          <p className="final-cta-sub">Our experienced agents are ready to guide you through every step.</p>
          <div className="flex justify-center gap-md" style={{marginTop:'var(--space-xl)'}}>
            <Link to="/sale" className="btn btn-primary btn-lg">Browse Properties</Link>
            <Link to="/contact" className="btn btn-outline btn-lg">Contact an Agent</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
