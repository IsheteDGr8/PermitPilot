import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Phone, Mail, MapPin, Calendar, CheckCircle2 } from 'lucide-react'
import { SiteHeader, SiteFooter } from '@/components/site-chrome'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', dob: '', address: ''
  })

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setFormData({
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
          phone: user.user_metadata?.phone || '',
          dob: user.user_metadata?.dob || '',
          address: user.user_metadata?.address || ''
        })
      }
    }
    loadProfile()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
          phone: formData.phone,
          dob: formData.dob,
          address: formData.address
        }
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />
      <main style={{ flex: 1, maxWidth: '600px', width: '100%', margin: '0 auto', padding: '3rem 2rem' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Business Owner Profile</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            This information is securely stored and used by our AI to auto-fill municipal permit applications.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                <User size={14} /> Full Legal Name <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} placeholder="e.g., Jane Doe" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  <Mail size={14} /> Email Address
                </label>
                <input type="email" value={formData.email} disabled style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg-hover)', color: 'var(--color-text-muted)' }} />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  <Phone size={14} /> Phone Number
                </label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} placeholder="(555) 123-4567" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  <Calendar size={14} /> Date of Birth
                </label>
                <input type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  <MapPin size={14} /> Home Address
                </label>
                <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} placeholder="123 Main St, City, ST" />
              </div>
            </div>

            <button onClick={handleSave} disabled={loading || !formData.full_name} className="btn-primary" style={{ marginTop: '1rem', justifyContent: 'center' }}>
              {loading ? 'Saving...' : success ? <><CheckCircle2 size={18} /> Saved Successfully</> : 'Save Profile'}
            </button>
          </div>
        </motion.div>
      </main>
      <SiteFooter />
    </div>
  )
}