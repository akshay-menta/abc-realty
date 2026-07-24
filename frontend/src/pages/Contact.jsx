import { useState } from 'react'
import { inquiriesApi } from '../api/client'
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import './Contact.css'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    try {
      await inquiriesApi.create({ ...form, property_id: null, property_title: 'General Contact' })
      setSubmitted(true)
      toast.success('Message sent! We\'ll be in touch soon.')
    } catch {
      toast.error('Failed to send your message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="contact-page page-enter">
      {/* Header */}
      <div className="contact-header">
        <div className="container">
          <div className="section-label">Get in Touch</div>
          <h1 className="section-title">Contact ABC Realty</h1>
          <p className="section-subtitle">
            We're here to help you find your perfect property. Reach out and let's start the conversation.
          </p>
        </div>
      </div>

      <div className="container contact-body">
        <div className="contact-grid">
          {/* Info */}
          <div className="contact-info">
            <h2 className="contact-info-title">Let's Connect</h2>
            <p className="contact-info-desc">
              Whether you're buying, selling, or leasing, our team of experienced agents is ready to guide you through every step of the process.
            </p>

            <div className="contact-items">
              <div className="contact-item">
                <div className="contact-item-icon">
                  <MapPin size={22} />
                </div>
                <div>
                  <div className="contact-item-title">Our Office</div>
                  <div className="contact-item-val">123 Realty Boulevard<br/>Austin, TX 78701</div>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-item-icon">
                  <Phone size={22} />
                </div>
                <div>
                  <div className="contact-item-title">Phone</div>
                  <a href="tel:+15125550100" className="contact-item-val">(512) 555-0100</a>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-item-icon">
                  <Mail size={22} />
                </div>
                <div>
                  <div className="contact-item-title">Email</div>
                  <a href="mailto:info@abcrealty.com" className="contact-item-val">info@abcrealty.com</a>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-item-icon">
                  <Clock size={22} />
                </div>
                <div>
                  <div className="contact-item-title">Business Hours</div>
                  <div className="contact-item-val">Mon – Fri: 9AM – 6PM<br/>Sat: 10AM – 4PM · Sun: By appointment</div>
                </div>
              </div>
            </div>

            {/* Agents */}
            <div className="agents-section">
              <h3 className="agents-title">Our Agents</h3>
              <div className="agents-list">
                {[
                  { name: 'Sarah Mitchell', role: 'Senior Agent — Austin', phone: '(512) 555-0182', email: 'sarah@abcrealty.com' },
                  { name: 'James Rodriguez', role: 'Senior Agent — San Antonio', phone: '(210) 555-0247', email: 'james@abcrealty.com' },
                  { name: 'Emily Chen', role: 'Leasing Specialist', phone: '(512) 555-0391', email: 'emily@abcrealty.com' },
                ].map((a, i) => (
                  <div key={i} className="agent-card">
                    <div className="agent-card-avatar">{a.name.charAt(0)}</div>
                    <div>
                      <div className="agent-card-name">{a.name}</div>
                      <div className="agent-card-role">{a.role}</div>
                      <a href={`tel:${a.phone}`} className="agent-card-contact">{a.phone}</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="contact-form-card">
            {submitted ? (
              <div className="contact-success">
                <CheckCircle size={56} className="success-icon" />
                <h3>Message Received!</h3>
                <p>Thank you for reaching out. One of our agents will contact you within 1 business day.</p>
                <button className="btn btn-primary" onClick={() => setSubmitted(false)}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                <h2 className="form-title">Send Us a Message</h2>
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="your@email.com"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="(555) 000-0000"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message *</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Tell us what you're looking for — location, budget, type of property, timeline..."
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      rows={5}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg w-full" disabled={submitting}>
                    <Send size={18} />
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
