import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../../api/client'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import { Building, TrendingUp, Home, Key, CheckCircle, Clock, Eye, Plus, Users, DollarSign } from 'lucide-react'
import './AdminDashboard.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [sales, setSales] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([dashboardApi.stats(), dashboardApi.sales()])
      .then(([statsRes, salesRes]) => {
        setStats(statsRes.data)
        setSales(salesRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="admin-loading page-enter">
      <div className="loading-spinner" />
      <p>Loading dashboard...</p>
    </div>
  )

  // Chart data
  const monthlyLabels = (sales?.monthly || []).map(m => {
    const [year, month] = m.month.split('-')
    return MONTH_NAMES[parseInt(month) - 1] + ' ' + year.slice(2)
  })
  const monthlyVolume = (sales?.monthly || []).map(m => m.volume)
  const monthlyCount  = (sales?.monthly || []).map(m => m.count)

  const barData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: 'Sales Volume ($)',
        data: monthlyVolume,
        backgroundColor: 'rgba(201,169,110,0.7)',
        borderColor: 'rgba(201,169,110,1)',
        borderWidth: 2,
        borderRadius: 6,
        yAxisID: 'y',
      },
    ],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `$${(ctx.parsed.y || 0).toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (v) => `$${(v/1000).toFixed(0)}k`,
          color: '#6b7280',
          font: { size: 12 },
        },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      x: {
        ticks: { color: '#6b7280', font: { size: 11 } },
        grid: { display: false },
      },
    },
  }

  // Type doughnut
  const byType = sales?.by_type || []
  const doughnutData = {
    labels: byType.map(t => t.type),
    datasets: [{
      data: byType.map(t => t.count),
      backgroundColor: ['#1a2744','#c9a96e','#4a5568','#c9a96e88','#1a274488','#374151'],
      borderWidth: 0,
    }],
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { font: { size: 12 }, color: '#374151', padding: 12 } },
    },
  }

  return (
    <div className="admin-dashboard page-enter">
      <div className="admin-header">
        <div className="container">
          <div className="admin-header-inner">
            <div>
              <h1 className="admin-title">Admin Dashboard</h1>
              <p className="admin-subtitle">Manage your ABC Realty portfolio</p>
            </div>
            <Link to="/admin/properties/new" className="btn btn-primary">
              <Plus size={16} /> Add Property
            </Link>
          </div>
        </div>
      </div>

      <div className="container admin-content">
        {/* Stat Cards */}
        <div className="stat-cards">
          <div className="stat-card">
            <div className="stat-card-icon" style={{background:'rgba(26,39,68,0.1)', color:'var(--primary)'}}>
              <Building size={24} />
            </div>
            <div className="stat-card-value">{stats?.total_properties || 0}</div>
            <div className="stat-card-label">Total Properties</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{background:'rgba(5,150,105,0.1)', color:'var(--status-published)'}}>
              <CheckCircle size={24} />
            </div>
            <div className="stat-card-value">{stats?.published || 0}</div>
            <div className="stat-card-label">Published</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{background:'rgba(217,119,6,0.1)', color:'var(--status-under-contract)'}}>
              <Clock size={24} />
            </div>
            <div className="stat-card-value">{stats?.under_contract || 0}</div>
            <div className="stat-card-label">Under Contract</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{background:'rgba(201,169,110,0.15)', color:'var(--accent-dark)'}}>
              <Home size={24} />
            </div>
            <div className="stat-card-value">{stats?.for_sale || 0}</div>
            <div className="stat-card-label">For Sale</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{background:'rgba(124,58,237,0.1)', color:'var(--status-yet-to-publish)'}}>
              <Key size={24} />
            </div>
            <div className="stat-card-value">{stats?.for_lease || 0}</div>
            <div className="stat-card-label">For Lease</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{background:'rgba(239,68,68,0.1)', color:'#ef4444'}}>
              <Users size={24} />
            </div>
            <div className="stat-card-value">{stats?.total_inquiries || 0}</div>
            <div className="stat-card-label">Inquiries</div>
          </div>
        </div>

        {/* Sales Summary */}
        <div className="sales-summary-row">
          <div className="summary-card">
            <DollarSign size={20} />
            <div>
              <div className="summary-val">${(sales?.total_volume || 0).toLocaleString()}</div>
              <div className="summary-lab">Total Sales Volume (Last 12 Months)</div>
            </div>
          </div>
          <div className="summary-card">
            <TrendingUp size={20} />
            <div>
              <div className="summary-val">{sales?.total_count || 0}</div>
              <div className="summary-lab">Properties Sold (Last 12 Months)</div>
            </div>
          </div>
          <div className="summary-card">
            <Building size={20} />
            <div>
              <div className="summary-val">
                {sales?.total_count ? `$${Math.round((sales.total_volume || 0) / sales.total_count).toLocaleString()}` : 'N/A'}
              </div>
              <div className="summary-lab">Average Sale Price</div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="charts-row">
          <div className="chart-card">
            <h3 className="chart-title">Monthly Sales Volume</h3>
            <div className="chart-wrap" style={{height: 280}}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
          <div className="chart-card chart-card-sm">
            <h3 className="chart-title">Sales by Property Type</h3>
            <div className="chart-wrap" style={{height: 280}}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* Sales by City */}
        {sales?.by_city?.length > 0 && (
          <div className="section-card">
            <div className="section-card-header">
              <h3>Sales by City</h3>
            </div>
            <div className="city-table">
              {sales.by_city.slice(0, 8).map((c, i) => (
                <div key={c.city} className="city-row">
                  <div className="city-rank">#{i + 1}</div>
                  <div className="city-name">{c.city}, {sales.records?.[0]?.state || 'TX'}</div>
                  <div className="city-bar-wrap">
                    <div
                      className="city-bar"
                      style={{ width: `${(c.volume / (sales.by_city[0]?.volume || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="city-vol">${(c.volume / 1000).toFixed(0)}k</div>
                  <div className="city-count">{c.count} sales</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Closed */}
        {sales?.recent_closed?.length > 0 && (
          <div className="section-card">
            <div className="section-card-header">
              <h3>Recently Closed Properties</h3>
              <Link to="/admin/properties" className="btn btn-ghost btn-sm">View All</Link>
            </div>
            <div className="recent-table">
              <div className="recent-table-header">
                <span>Property</span>
                <span>City</span>
                <span>Price</span>
                <span>Status</span>
              </div>
              {sales.recent_closed.map(p => (
                <div key={p.id} className="recent-row">
                  <span className="recent-title">{p.title}</span>
                  <span>{p.city}, {p.state}</span>
                  <span className="recent-price">${(p.price || 0).toLocaleString()}</span>
                  <span className={`status-badge status-${p.status}`}>{p.status.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="quick-actions">
          <Link to="/admin/properties" className="qa-btn">
            <Eye size={20} />
            <span>Manage All Properties</span>
          </Link>
          <Link to="/admin/properties/new" className="qa-btn primary">
            <Plus size={20} />
            <span>Add New Property</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
