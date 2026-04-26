import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  Database,
  Plane
} from 'lucide-react'
import { SiteHeader, SiteFooter } from '@/components/site-chrome'
import { StatusBadge } from '@/components/status-badge'
import { getApplications } from '@/lib/api'
import type { IntakeData, AgentResult } from '@/lib/types'

export const Route = createFileRoute('/admin')({
  component: AdminDashboard,
})

interface DbApplication {
  id: number;
  application_id: string;
  intake_data: IntakeData;
  agent_results: AgentResult[];
  overall_status: string;
  created_at: string;
}

function AdminDashboard() {
  const [applications, setApplications] = useState<DbApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getApplications()
      setApplications(data.applications || [])
    } catch (err: unknown) {
      console.error('Failed to fetch applications:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect to the backend.')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredApps = applications.filter((app) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      app.application_id.toLowerCase().includes(q) ||
      app.intake_data.business_info?.business_name.toLowerCase().includes(q) ||
      app.intake_data.project_type.toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />

      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '2rem var(--spacing-page)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={24} style={{ color: 'var(--color-accent)' }} />
              Admin Dashboard
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
              View and manage submitted permit applications
            </p>
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 1rem 0.6rem 2.5rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
            />
          </div>
        </div>

        {/* Stats row */}
        {!isLoading && !error && applications.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Applications</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{applications.length}</div>
            </div>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <CheckCircle2 size={14} /> Clear Applications
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                {applications.filter(a => a.overall_status === 'all_clear').length}
              </div>
            </div>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <AlertTriangle size={14} /> With Conflicts
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                {applications.filter(a => a.overall_status === 'conflicts_detected').length}
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Plane size={32} style={{ color: 'var(--color-accent)', margin: '0 auto 1rem', animation: 'float 3s ease-in-out infinite' }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading applications from Supabase...</p>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--color-danger)',
            textAlign: 'center',
          }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Database Connection Error</h3>
            <p style={{ fontSize: '0.9rem' }}>{error}</p>
            <p style={{ fontSize: '0.85rem', marginTop: '1rem', color: 'var(--color-text-secondary)' }}>
              Make sure you have created the Supabase table using the SQL schema.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredApps.length === 0 && (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <FileText size={48} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No applications found</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {searchQuery ? "We couldn't find any applications matching your search." : "No one has submitted a permit application yet."}
            </p>
          </div>
        )}

        {/* Applications List */}
        {!isLoading && !error && filteredApps.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredApps.map((app, i) => (
              <motion.div
                key={app.id || app.application_id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card glass-card-hover"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1.25rem 1.5rem',
                  gap: '1.5rem',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  // In a real app we'd navigate to a detail view, but for now we'll load it into local storage and go to review page
                  localStorage.setItem('permitResult', JSON.stringify({
                    application_id: app.application_id,
                    overall_status: app.overall_status,
                    agents: app.agent_results,
                    cross_agent_conflicts: [], // Simplified for this view
                    checklist: [], // Simplified for this view
                    total_estimated_cost: 0,
                    evaluated_at: app.created_at
                  }))
                  localStorage.setItem('permitIntake', JSON.stringify(app.intake_data))
                  window.location.href = '/review'
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-sm)',
                  background: app.overall_status === 'all_clear' ? 'var(--color-success-bg)' : app.overall_status === 'conflicts_detected' ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}>
                  {app.overall_status === 'all_clear' ? (
                    <CheckCircle2 size={24} style={{ color: 'var(--color-success)' }} />
                  ) : app.overall_status === 'conflicts_detected' ? (
                    <AlertTriangle size={24} style={{ color: 'var(--color-danger)' }} />
                  ) : (
                    <Clock size={24} style={{ color: 'var(--color-warning)' }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {app.intake_data?.business_info?.business_name || 'Unnamed Business'}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {app.application_id}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    <span>{app.intake_data?.project_type?.replace(/_/g, ' ')}</span>
                    <span>•</span>
                    <span>{app.intake_data?.location_details?.operating_zone || 'Unknown Zone'}</span>
                    <span>•</span>
                    <span>{new Date(app.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <StatusBadge status={app.overall_status === 'all_clear' ? 'approved' : app.overall_status === 'conflicts_detected' ? 'conflict' : 'error'} />
                  <ChevronRight size={20} style={{ color: 'var(--color-text-muted)' }} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
