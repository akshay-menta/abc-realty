import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { propertiesApi } from '../../api/client'
import toast from 'react-hot-toast'
import { Upload, X, Plus, ChevronRight, ChevronLeft, Check, Image, FileText } from 'lucide-react'
import './PropertyForm.css'

const US_STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY']
const PROPERTY_TYPES = ['Single Family', 'Condo', 'Townhouse', 'Apartment', 'Commercial', 'Land', 'Multi-Family']
const STEPS = ['Basic Info', 'Location', 'Details', 'Photos', 'Contact', 'Review']

const emptyForm = {
  title: '',
  listing_type: 'sale',
  property_type: 'Single Family',
  status: 'yet_to_publish',
  price: '',
  price_period: '',
  bedrooms: '',
  bathrooms: '',
  sqft: '',
  lot_size: '',
  year_built: '',
  garage: '',
  address: '',
  city: '',
  state: 'TX',
  zip_code: '',
  country: 'USA',
  latitude: '',
  longitude: '',
  description: '',
  highlights: [],
  basic_info: {},
  contact_name: '',
  contact_phone: '',
  contact_email: '',
}

export default function PropertyForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(isEdit)
  const [savedId, setSavedId] = useState(null)

  // Photos & Docs state
  const [photos, setPhotos] = useState([]) // existing paths on server
  const [newPhotos, setNewPhotos] = useState([]) // File objects + preview
  const [newDocs, setNewDocs] = useState([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const photosRef = useRef([])

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  const [highlightInput, setHighlightInput] = useState('')
  const [biKey, setBiKey] = useState('')
  const [biVal, setBiVal] = useState('')

  const photoInputRef = useRef(null)
  const docInputRef = useRef(null)

  useEffect(() => {
    if (isEdit) {
      propertiesApi.get(id)
        .then(res => {
          const p = res.data
          setForm({
            title: p.title || '',
            listing_type: p.listing_type || 'sale',
            property_type: p.property_type || 'Single Family',
            status: p.status || 'yet_to_publish',
            price: p.price || '',
            price_period: p.price_period || '',
            bedrooms: p.bedrooms || '',
            bathrooms: p.bathrooms || '',
            sqft: p.sqft || '',
            lot_size: p.lot_size || '',
            year_built: p.year_built || '',
            garage: p.garage || '',
            address: p.address || '',
            city: p.city || '',
            state: p.state || 'TX',
            zip_code: p.zip_code || '',
            country: p.country || 'USA',
            latitude: p.latitude || '',
            longitude: p.longitude || '',
            description: p.description || '',
            highlights: p.highlights || [],
            basic_info: p.basic_info || {},
            contact_name: p.contact_name || '',
            contact_phone: p.contact_phone || '',
            contact_email: p.contact_email || '',
          })
          setPhotos(p.photos || [])
          setSavedId(p.id)
        })
        .finally(() => setLoadingData(false))
    }
  }, [id, isEdit])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  // Highlights
  const addHighlight = () => {
    if (!highlightInput.trim()) return
    setForm(f => ({ ...f, highlights: [...f.highlights, highlightInput.trim()] }))
    setHighlightInput('')
  }
  const removeHighlight = (i) => setForm(f => ({ ...f, highlights: f.highlights.filter((_, j) => j !== i) }))

  // Basic Info
  const addBiEntry = () => {
    if (!biKey.trim() || !biVal.trim()) return
    setForm(f => ({ ...f, basic_info: { ...f.basic_info, [biKey.trim()]: biVal.trim() } }))
    setBiKey(''); setBiVal('')
  }
  const removeBiEntry = (key) => {
    setForm(f => {
      const info = { ...f.basic_info }
      delete info[key]
      return { ...f, basic_info: info }
    })
  }

  // Photo handling
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files)
    const previews = files.map(f => ({
      file: f,
      url: URL.createObjectURL(f),
      name: f.name,
    }))
    setNewPhotos(prev => [...prev, ...previews].slice(0, 40))
  }

  const removeNewPhoto = (i) => setNewPhotos(prev => prev.filter((_, j) => j !== i))
  const removeExistingPhoto = (i) => setPhotos(prev => prev.filter((_, j) => j !== i))

  const handleDocSelect = (e) => {
    const files = Array.from(e.target.files)
    setNewDocs(prev => [...prev, ...files])
  }

  // Save property (create or update) — photos are NEVER sent in the main payload
  // (that was wiping uploads). Photos go through /photos endpoints only.
  const saveProperty = async ({ uploadFiles = true } = {}) => {
    if (!form.title || !form.price) {
      toast.error('Title and price are required')
      return null
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price) || 0,
        bedrooms: parseInt(form.bedrooms) || 0,
        bathrooms: parseFloat(form.bathrooms) || 0,
        sqft: parseInt(form.sqft) || 0,
        year_built: parseInt(form.year_built) || 0,
        garage: parseInt(form.garage) || 0,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      }
      // Explicitly do not touch photos via this payload
      delete payload.photos

      let propertyId
      if (isEdit || savedId) {
        propertyId = savedId || parseInt(id, 10)
        await propertiesApi.update(propertyId, payload)
        setSavedId(propertyId)
      } else {
        const res = await propertiesApi.create(payload)
        propertyId = res.data.id
        setSavedId(propertyId)
      }

      let currentPhotos = [...(photosRef.current || [])]

      // Upload newly selected files — API places them first as the cover image
      if (uploadFiles && newPhotos.length > 0) {
        // Sync kept existing photos first only if we still have some
        if (currentPhotos.length > 0) {
          await propertiesApi.replacePhotos(propertyId, currentPhotos)
        }

        setUploadingPhotos(true)
        const formData = new FormData()
        newPhotos.forEach(p => {
          if (p.file) formData.append('photos', p.file, p.name || p.file.name || 'photo.jpg')
        })
        const uploadRes = await propertiesApi.uploadPhotos(propertyId, formData)
        currentPhotos = uploadRes.data?.photos || []
        if (!currentPhotos.length) {
          throw new Error(uploadRes.data?.error || 'Photo upload returned no files')
        }
        setPhotos(currentPhotos)
        photosRef.current = currentPhotos
        setNewPhotos([])
        toast.success(`${uploadRes.data.uploaded || 1} photo(s) saved as cover`)
        setUploadingPhotos(false)
      } else if (uploadFiles && (isEdit || savedId)) {
        // No new files — sync existing list so removals persist
        await propertiesApi.replacePhotos(propertyId, currentPhotos)
      }

      if (uploadFiles && newDocs.length > 0) {
        const formData = new FormData()
        newDocs.forEach(d => formData.append('documents', d))
        await propertiesApi.uploadDocuments(propertyId, formData)
        setNewDocs([])
      }

      return propertyId
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Failed to save property'
      toast.error(msg)
      console.error(err)
      return null
    } finally {
      setLoading(false)
      setUploadingPhotos(false)
    }
  }

  const handleSubmit = async () => {
    const pid = await saveProperty({ uploadFiles: true })
    if (pid) {
      toast.success(isEdit ? 'Property updated!' : 'Property created!')
      navigate('/admin/properties')
    }
  }

  const nextStep = async () => {
    if (step === 0 && (!form.title || !form.price)) {
      toast.error('Please fill in title and price')
      return
    }
    // Auto-save early steps without touching files; on Photos step upload selected files
    if (step <= 2) {
      const pid = await saveProperty({ uploadFiles: false })
      if (!pid) return
    } else if (step === 3) {
      const pid = await saveProperty({ uploadFiles: true })
      if (!pid) return
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  if (loadingData) return (
    <div className="admin-loading page-enter">
      <div className="loading-spinner" />
      <p>Loading property...</p>
    </div>
  )

  return (
    <div className="prop-form-page page-enter">
      <div className="admin-header">
        <div className="container">
          <div className="admin-header-inner">
            <div>
              <h1 className="admin-title">{isEdit ? 'Edit Property' : 'Add New Property'}</h1>
              <p className="admin-subtitle">Fill in the details to {isEdit ? 'update' : 'create'} your listing</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container admin-content">
        {/* Step indicators */}
        <div className="steps-bar">
          {STEPS.map((s, i) => (
            <div key={s} className={`step-item ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <div className="step-num">
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className="step-label">{s}</span>
              {i < STEPS.length - 1 && <div className="step-connector" />}
            </div>
          ))}
        </div>

        <div className="form-card">
          {/* Step 0: Basic Info */}
          {step === 0 && (
            <div className="form-step animate-fade-up">
              <h2 className="step-title">Basic Information</h2>
              <div className="form-grid-2">
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Property Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Sunset Ridge Manor"
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Listing Type *</label>
                  <select className="form-select" value={form.listing_type} onChange={e => set('listing_type', e.target.value)}>
                    <option value="sale">For Sale</option>
                    <option value="lease">For Lease</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Property Type *</label>
                  <select className="form-select" value={form.property_type} onChange={e => set('property_type', e.target.value)}>
                    {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                    <option value="yet_to_publish">Yet to Publish</option>
                    <option value="published">Published</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Price *</label>
                  <input type="number" className="form-input" placeholder="e.g., 450000" value={form.price} onChange={e => set('price', e.target.value)} min={0} />
                </div>
                {form.listing_type === 'lease' && (
                  <div className="form-group">
                    <label className="form-label">Price Period</label>
                    <select className="form-select" value={form.price_period} onChange={e => set('price_period', e.target.value)}>
                      <option value="/mo">/mo (per month)</option>
                      <option value="/yr">/yr (per year)</option>
                      <option value="/sqft">/sqft</option>
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Bedrooms</label>
                  <input type="number" className="form-input" placeholder="e.g., 3" value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">Bathrooms</label>
                  <input type="number" className="form-input" placeholder="e.g., 2.5" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} min={0} step={0.5} />
                </div>
                <div className="form-group">
                  <label className="form-label">Square Feet</label>
                  <input type="number" className="form-input" placeholder="e.g., 2500" value={form.sqft} onChange={e => set('sqft', e.target.value)} min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">Lot Size</label>
                  <input type="text" className="form-input" placeholder="e.g., 0.25 acres" value={form.lot_size} onChange={e => set('lot_size', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Year Built</label>
                  <input type="number" className="form-input" placeholder="e.g., 2018" value={form.year_built} onChange={e => set('year_built', e.target.value)} min={1800} max={2030} />
                </div>
                <div className="form-group">
                  <label className="form-label">Garage Spaces</label>
                  <input type="number" className="form-input" placeholder="e.g., 2" value={form.garage} onChange={e => set('garage', e.target.value)} min={0} />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <div className="form-step animate-fade-up">
              <h2 className="step-title">Location Details</h2>
              <div className="form-grid-2">
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Street Address</label>
                  <input type="text" className="form-input" placeholder="e.g., 123 Main Street" value={form.address} onChange={e => set('address', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input type="text" className="form-input" placeholder="e.g., Austin" value={form.city} onChange={e => set('city', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <select className="form-select" value={form.state} onChange={e => set('state', e.target.value)}>
                    {US_STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">ZIP Code</label>
                  <input type="text" className="form-input" placeholder="e.g., 78701" value={form.zip_code} onChange={e => set('zip_code', e.target.value)} maxLength={10} />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <select className="form-select" value={form.country} onChange={e => set('country', e.target.value)}>
                    <option value="USA">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Mexico">Mexico</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Latitude (optional)</label>
                  <input type="number" className="form-input" placeholder="e.g., 30.2672" value={form.latitude} onChange={e => set('latitude', e.target.value)} step={0.0001} />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude (optional)</label>
                  <input type="number" className="form-input" placeholder="e.g., -97.7431" value={form.longitude} onChange={e => set('longitude', e.target.value)} step={0.0001} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="form-step animate-fade-up">
              <h2 className="step-title">Property Details & Description</h2>
              <div className="form-group" style={{ marginBottom: 'var(--space-xl)' }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe the property in detail — location, unique features, neighborhood, etc."
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  rows={6}
                />
              </div>

              {/* Highlights */}
              <div className="form-group" style={{ marginBottom: 'var(--space-xl)' }}>
                <label className="form-label">Property Highlights</label>
                <div className="tag-input-row">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Resort-style pool"
                    value={highlightInput}
                    onChange={e => setHighlightInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                  />
                  <button type="button" className="btn btn-dark btn-sm" onClick={addHighlight}>
                    <Plus size={14} /> Add
                  </button>
                </div>
                <div className="tags-list">
                  {form.highlights.map((h, i) => (
                    <div key={i} className="tag">
                      {h}
                      <button onClick={() => removeHighlight(i)}><X size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Basic Info */}
              <div className="form-group">
                <label className="form-label">Property Details (Key-Value Pairs)</label>
                <p className="form-hint">Add details like HOA fees, parking, utilities, pet policy, etc.</p>
                <div className="bi-input-row">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Key (e.g., HOA)"
                    value={biKey}
                    onChange={e => setBiKey(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Value (e.g., $250/month)"
                    value={biVal}
                    onChange={e => setBiVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addBiEntry())}
                  />
                  <button type="button" className="btn btn-dark btn-sm" onClick={addBiEntry}>
                    <Plus size={14} /> Add
                  </button>
                </div>
                {Object.keys(form.basic_info).length > 0 && (
                  <div className="bi-table">
                    {Object.entries(form.basic_info).map(([k, v]) => (
                      <div key={k} className="bi-row">
                        <span className="bi-key">{k}</span>
                        <span className="bi-val">{v}</span>
                        <button className="bi-remove" onClick={() => removeBiEntry(k)}><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Photos */}
          {step === 3 && (
            <div className="form-step animate-fade-up">
              <h2 className="step-title">Photos & Documents</h2>
              <p className="step-subtitle">Upload up to 40 photos. First photo will be the cover image.</p>

              {/* Photo Upload */}
              <div
                className="upload-zone"
                onClick={() => photoInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
                  const previews = files.map(f => ({ file: f, url: URL.createObjectURL(f), name: f.name }))
                  setNewPhotos(prev => [...prev, ...previews].slice(0, 40))
                }}
              >
                <Image size={40} className="upload-icon" />
                <div className="upload-text">Drag & drop photos here, or click to browse</div>
                <div className="upload-hint">PNG, JPG, WEBP up to 50MB each • Max 40 photos</div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handlePhotoSelect}
                />
              </div>

              {/* Existing Photos */}
              {photos.length > 0 && (
                <div style={{ marginTop: 'var(--space-lg)' }}>
                  <div className="upload-section-label">Existing Photos ({photos.length})</div>
                  <div className="photos-grid">
                    {photos.map((p, i) => (
                      <div key={i} className="photo-thumb">
                        <img src={p} alt={`Photo ${i + 1}`} onError={e => { e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200' }} />
                        {i === 0 && <div className="cover-badge">Cover</div>}
                        <button className="remove-photo" onClick={() => removeExistingPhoto(i)}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Photos */}
              {newPhotos.length > 0 && (
                <div style={{ marginTop: 'var(--space-lg)' }}>
                  <div className="upload-section-label">New Photos to Upload ({newPhotos.length})</div>
                  <div className="photos-grid">
                    {newPhotos.map((p, i) => (
                      <div key={i} className="photo-thumb new">
                        <img src={p.url} alt={p.name} />
                        <button className="remove-photo" onClick={() => removeNewPhoto(i)}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Document Upload */}
              <div style={{ marginTop: 'var(--space-xl)' }}>
                <label className="form-label">Upload Documents (PDF, DOC)</label>
                <div
                  className="upload-zone upload-zone-sm"
                  onClick={() => docInputRef.current?.click()}
                >
                  <FileText size={28} className="upload-icon" />
                  <div className="upload-text">Click to upload documents</div>
                  <input
                    ref={docInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xlsx"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleDocSelect}
                  />
                </div>
                {newDocs.length > 0 && (
                  <div className="docs-list">
                    {newDocs.map((d, i) => (
                      <div key={i} className="doc-item">
                        <FileText size={14} />
                        <span>{d.name}</span>
                        <button onClick={() => setNewDocs(prev => prev.filter((_, j) => j !== i))}><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Contact */}
          {step === 4 && (
            <div className="form-step animate-fade-up">
              <h2 className="step-title">Contact Information</h2>
              <p className="step-subtitle">Who should prospects contact about this property?</p>
              <div className="form-grid-2">
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Agent / Contact Name</label>
                  <input type="text" className="form-input" placeholder="e.g., Sarah Mitchell" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="tel" className="form-input" placeholder="e.g., (512) 555-0100" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" placeholder="e.g., agent@abcrealty.com" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="form-step animate-fade-up">
              <h2 className="step-title">Review & Publish</h2>
              <div className="review-grid">
                <div className="review-card">
                  <div className="review-label">Title</div>
                  <div className="review-val">{form.title || '—'}</div>
                </div>
                <div className="review-card">
                  <div className="review-label">Type</div>
                  <div className="review-val">{form.property_type} — {form.listing_type === 'sale' ? 'For Sale' : 'For Lease'}</div>
                </div>
                <div className="review-card">
                  <div className="review-label">Price</div>
                  <div className="review-val">${Number(form.price).toLocaleString()}{form.price_period}</div>
                </div>
                <div className="review-card">
                  <div className="review-label">Status</div>
                  <div className="review-val"><span className={`status-badge status-${form.status}`}>{form.status.replace(/_/g, ' ')}</span></div>
                </div>
                <div className="review-card">
                  <div className="review-label">Location</div>
                  <div className="review-val">{form.address}, {form.city}, {form.state} {form.zip_code}</div>
                </div>
                <div className="review-card">
                  <div className="review-label">Specs</div>
                  <div className="review-val">{form.bedrooms}bd / {form.bathrooms}ba / {Number(form.sqft).toLocaleString()} sqft</div>
                </div>
                <div className="review-card">
                  <div className="review-label">Photos</div>
                  <div className="review-val">{photos.length + newPhotos.length} photos</div>
                </div>
                <div className="review-card">
                  <div className="review-label">Contact</div>
                  <div className="review-val">{form.contact_name} · {form.contact_phone}</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="form-nav">
            <button
              className="btn btn-ghost"
              onClick={() => setStep(s => Math.max(s - 1, 0))}
              disabled={step === 0}
            >
              <ChevronLeft size={16} /> Back
            </button>
            <div className="step-progress">Step {step + 1} of {STEPS.length}</div>
            {step < STEPS.length - 1 ? (
              <button className="btn btn-primary" onClick={nextStep} disabled={loading}>
                {loading ? 'Saving...' : 'Next'} <ChevronRight size={16} />
              </button>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={loading || uploadingPhotos}>
                {loading || uploadingPhotos ? 'Saving...' : '✓ Save Property'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
