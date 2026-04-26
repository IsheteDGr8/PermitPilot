import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  Database,
  Plane,
  Trash2,
  LogOut,
  Plus
} from 'lucide-react'
import { SiteHeader, SiteFooter } from '@/components/site-chrome'
import { StatusBadge } from '@/components/status-badge'
import { getApplications, deleteApplication } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import type { IntakeData, AgentResult, CrossAgentConflict, ChecklistItem } from '@/lib/types'

export const Route = createFileRoute('/portal')({
  component: UserPortal,
})

interface DbApplication {
  id: number;
  application_id: string;
  intake_data: IntakeData;
  agent_results: AgentResult[];
  cross_agent_conflicts?: CrossAgentConflict[];
  checklist?: ChecklistItem[];
  total_estimated_cost?: number;
  overall_status: string;
  created_at: string;
}

function UserPortal() {
  const navigate = useNavigate()
  const [session, setSession] = useState<any>(null)
  const [applications, setApplications] = useState<DbApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) {
        navigate({ to: '/auth' })
      } else {
        fetchApplications(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) {
        navigate({ to: '/auth' })
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  const fetchApplications = async (userId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getApplications(userId)
      setApplications(data.applications || [])
    } catch (err: any) {
      setError(err.message || 'Failed to connect to the backend.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, appId: string) => {
    e.stopPropagation()
    if (!session?.user?.id) return
    if (!confirm('Are you sure you want to delete this business analysis?')) return
    
    setDeletingId(appId)
    try {
      await deleteApplication(appId, session.user.id)
      setApplications(apps => apps.filter(a => a.application_id !== appId))
    } catch (err: any) {
      alert('Failed to delete application: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate({ to: '/' })
  }

  if (!session) return null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />

      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '2rem var(--spacing-page)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={24} style={{ color: 'var(--color-accent)' }} />
              My Businesses
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
              Logged in as {session.user.email}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/start" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
              <Plus size={16} /> New Analysis
            </Link>
            <button onClick={handleSignOut} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Plane size={32} style={{ color: 'var(--color-accent)', margin: '0 auto 1rem', animation: 'float 3s ease-in-out infinite' }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading your analyses...</p>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div style={{
            padding: '1.5rem', borderRadius: 'var(--radius-md)', background: 'var(--color-danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--color-danger)', textAlign: 'center',
          }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Connection Error</h3>
            <p style={{ fontSize: '0.9rem' }}>{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && applications.length === 0 && (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <FileText size={48} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No businesses yet</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              You haven't analyzed any businesses yet. Start a new permit application to see it here.
            </p>
            <Link to="/start" className="btn-primary" style={{ display: 'inline-flex' }}>
              Start Application <ChevronRight size={16} />
            </Link>
          </div>
        )}

        {/* Applications List */}
        {!isLoading && !error && applications.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {applications.map((app, i) => (
              <motion.div
                key={app.id || app.application_id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card glass-card-hover"
                style={{
                  display: 'flex', alignItems: 'center', padding: '1.25rem 1.5rem', gap: '1.5rem', cursor: 'pointer',
                  opacity: deletingId === app.application_id ? 0.5 : 1
                }}
                onClick={() => {
                  localStorage.setItem('permitResult', JSON.stringify({
                    application_id: app.application_id,
                    overall_status: app.overall_status,
                    agents: app.agent_results,
                    cross_agent_conflicts: app.cross_agent_conflicts || [],
                    checklist: app.checklist || [],
                    total_estimated_cost: app.total_estimated_cost || 0,
                    evaluated_at: app.created_at
                  }))
                  localStorage.setItem('permitIntake', JSON.stringify(app.intake_data))
                  localStorage.setItem('permitFromPortal', 'true') // Flag to show "Back to Portal" in review
                  window.location.href = '/review'
                }}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: 'var(--radius-sm)',
                  background: app.overall_status === 'all_clear' ? 'var(--color-success-bg)' : app.overall_status === 'conflicts_detected' ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
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
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                    <span>{app.intake_data?.project_type?.replace(/_/g, ' ')}</span>
                    <span>•</span>
                    <span>{app.intake_data?.location_details?.operating_zone || 'Unknown Zone'}</span>
                    <span>•</span>
                    <span>{new Date(app.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <StatusBadge status={app.overall_status === 'all_clear' ? 'approved' : app.overall_status === 'conflicts_detected' ? 'conflict' : 'error'} />
                  
                  <button 
                    onClick={(e) => handleDelete(e, app.application_id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: 'var(--color-text-muted)' }}
                    title="Delete analysis"
                  >
                    <Trash2 size={18} />
                  </button>

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
