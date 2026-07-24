import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { propertiesApi } from '../../api/client'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Eye, ChevronUp, ChevronDown, Search, Filter } from 'lucide-react'
import { getCoverImage, DEFAULT_PLACEHOLDER } from '../../utils/coverImage'
import './AdminPropertyList.css'

const STATUS_OPTIONS = ['all', 'yet_to_publish', 'published', 'closed']
const STATUS_LABELS = {
  yet_to_publish: 'Yet to Publish',
  published: 'Published',
  closed: 'Closed',
}

export default function AdminPropertyList() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [deletingId, setDeletingId] = useState(null)

  const fetchProperties = async () => {
    setLoading(true)
    try {
      // Fetch all properties including yet_to_publish for admin
      const params = { per_page: 100, status: 'yet_to_publish,published,closed' }
      if (typeFilter !== 'all') params.listing_type = typeFilter
      const res = await propertiesApi.list(params)
      setProperties(res.data.properties)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProperties() }, [typeFilter])

  const handleStatusChange = async (id, newStatus) => {
    try {
      await propertiesApi.updateStatus(id, newStatus)
      toast.success(`Status updated to "${STATUS_LABELS[newStatus]}"`)
      fetchProperties()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await propertiesApi.delete(id)
      toast.success('Property deleted')
      fetchProperties()
    } catch {
      toast.error('Failed to delete property')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = properties.filter(p => {
    const matchSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="admin-prop-list page-enter">
      <div className="admin-header">
        <div className="container">
          <div className="admin-header-inner">
            <div>
              <h1 className="admin-title">Property Management</h1>
              <p className="admin-subtitle">Manage all your property listings</p>
            </div>
            <Link to="/admin/properties/new" className="btn btn-primary">
              <Plus size={16} /> Add Property
            </Link>
          </div>
        </div>
      </div>

      <div className="container admin-content">
        {/* Toolbar */}
        <div className="list-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by title or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-tabs">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                className={`filter-tab ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'all' ? 'All' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <div className="type-tabs">
            <button className={`type-tab ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>All Types</button>
            <button className={`type-tab ${typeFilter === 'sale' ? 'active' : ''}`} onClick={() => setTypeFilter('sale')}>For Sale</button>
            <button className={`type-tab ${typeFilter === 'lease' ? 'active' : ''}`} onClick={() => setTypeFilter('lease')}>For Lease</button>
          </div>
        </div>

        <div className="prop-table-wrap">
          {loading ? (
            <div className="table-loading">
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{height:64, marginBottom:2}} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏠</div>
              <h3>No properties found</h3>
              <p>Try adjusting your search or filters.</p>
              <Link to="/admin/properties/new" className="btn btn-primary">Add First Property</Link>
            </div>
          ) : (
            <table className="prop-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Photos</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="prop-row-info">
                        <img
                          src={getCoverImage(p, 80)}
                          alt={p.title}
                          className="prop-row-img"
                          onError={(e) => { e.target.src = DEFAULT_PLACEHOLDER }}
                        />
                        <div>
                          <div className="prop-row-title">{p.title}</div>
                          <div className="prop-row-type">{p.property_type}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`type-badge ${p.listing_type}`}>
                        {p.listing_type === 'sale' ? 'Sale' : 'Lease'}
                      </span>
                    </td>
                    <td>
                      <div className="prop-row-price">
                        ${p.price?.toLocaleString()}{p.price_period}
                      </div>
                    </td>
                    <td>
                      <div className="prop-row-loc">{p.city}, {p.state}</div>
                      <div className="prop-row-zip">{p.zip_code}</div>
                    </td>
                    <td>
                      <select
                        value={p.status}
                        onChange={e => handleStatusChange(p.id, e.target.value)}
                        className={`status-select status-${p.status}`}
                      >
                        <option value="yet_to_publish">Yet to Publish</option>
                        <option value="published">Published</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td>
                      <span className="photo-count">{p.photos?.length || 0} photos</span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="action-btn view"
                          onClick={() => window.open(`/property/${p.slug}`, '_blank')}
                          title="View"
                        ><Eye size={15} /></button>
                        <Link to={`/admin/properties/${p.id}/edit`} className="action-btn edit" title="Edit">
                          <Edit size={15} />
                        </Link>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDelete(p.id, p.title)}
                          disabled={deletingId === p.id}
                          title="Delete"
                        ><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="list-footer">
          <span>{filtered.length} of {properties.length} properties</span>
        </div>
      </div>
    </div>
  )
}
