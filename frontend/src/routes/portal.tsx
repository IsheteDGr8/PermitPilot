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
  Plus,
  DollarSign,
  ListChecks,
} from 'lucide-react'
import { SiteHeader, SiteFooter } from '@/components/site-chrome'
import { supabase } from '@/lib/supabase'
import type { IntakeData, AgentResult, CrossAgentConflict, ChecklistItem } from '@/lib/types'

export const Route = createFileRoute('/portal')({
  component: UserPortal,
})

interface DbApplication {
  id: string | number;
  application_id: string;
  intake_data: IntakeData;
  agent_results: AgentResult[];
  cross_agent_conflicts?: CrossAgentConflict[];
  checklist?: ChecklistItem[];
  total_estimated_cost?: number;
  overall_status: string;
  created_at: string;
}

/**
 * Determine a user-friendly display status for an application.
 * - "Approved" = all agents approved, no conflicts
 * - "In Progress" = checklist exists but still has pending items or has conflicts
 */
function getDisplayStatus(app: DbApplication): { label: string; color: string; icon: typeof CheckCircle2 } {
  const allClear = app.overall_status === 'all_clear'
  const hasConflicts = app.overall_status === 'conflicts_detected'

  if (allClear) {
    return { label: 'Approved', color: 'var(--color-success)', icon: CheckCircle2 }
  } else if (hasConflicts) {
    return { label: 'Needs Attention', color: 'var(--color-danger)', icon: AlertTriangle }
  } else {
    return { label: 'In Progress', color: 'var(--color-warning)', icon: Clock }
  }
}

function UserPortal() {
  const navigate = useNavigate()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [applications, setApplications] = useState<DbApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate({ to: '/auth' });
      return;
    }

    setUserEmail(user.email || null);

    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setApplications(data);
    if (error) setError(error.message);
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: '/' });
  };

  const handleDelete = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    setDeletingId(id.toString());

    const { error } = await supabase.from('applications').delete().eq('id', id);

    if (error) {
      console.error(error);
      alert("Failed to delete application.");
      setDeletingId(null);
    } else {
      setApplications(applications.filter(app => app.id !== id));
      setDeletingId(null);
    }
  };

  const handleViewApplication = (app: DbApplication) => {
    // Store the full evaluation data so the review page can display it
    localStorage.setItem('permitResult', JSON.stringify({
      application_id: app.application_id,
      overall_status: app.overall_status,
      agents: app.agent_results,
      cross_agent_conflicts: app.cross_agent_conflicts || [],
      checklist: app.checklist || [],
      total_estimated_cost: app.total_estimated_cost || 0,
      evaluated_at: app.created_at,
      evaluation_time_seconds: 0,
    }));
    localStorage.setItem('permitIntake', JSON.stringify(app.intake_data));
    localStorage.setItem('permitFromPortal', 'true');
    navigate({ to: '/review' });
  };

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
              Logged in as {userEmail || "loading..."}
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

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Plane size={32} style={{ color: 'var(--color-accent)', margin: '0 auto 1rem', animation: 'float 3s ease-in-out infinite' }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading your analyses...</p>
          </div>
        )}

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

        {!isLoading && !error && applications.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {applications.map((app, i) => {
              const displayStatus = getDisplayStatus(app)
              const StatusIcon = displayStatus.icon
              const totalChecklistCount = app.checklist?.length || 0;
              const pendingChecklistCount = app.checklist?.filter((item: any) => item.status !== 'completed').length || 0;
              const estimatedCost = app.total_estimated_cost || 0;

              return (
                <motion.div
                  key={app.id.toString()}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card glass-card-hover"
                  style={{
                    padding: '1.25rem 1.5rem',
                    cursor: 'pointer',
                    opacity: deletingId === app.id.toString() ? 0.5 : 1,
                  }}
                  onClick={() => handleViewApplication(app)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {/* Status Icon */}
                    <div style={{
                      width: '48px', height: '48px', borderRadius: 'var(--radius-sm)',
                      background: displayStatus.label === 'Approved'
                        ? 'var(--color-success-bg)'
                        : displayStatus.label === 'Needs Attention'
                          ? 'var(--color-danger-bg)'
                          : 'var(--color-warning-bg)',
                      display: 'grid', placeItems: 'center', flexShrink: 0,
                    }}>
                      <StatusIcon size={24} style={{ color: displayStatus.color }} />
                    </div>

                    {/* Business Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {app.intake_data?.business_info?.business_name || 'Unnamed Business'}
                        </h3>
                        {/* Status Badge */}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: displayStatus.label === 'Approved'
                            ? 'var(--color-success-bg)'
                            : displayStatus.label === 'Needs Attention'
                              ? 'var(--color-danger-bg)'
                              : 'var(--color-warning-bg)',
                          color: displayStatus.color,
                          border: `1px solid ${displayStatus.color}30`,
                        }}>
                          {displayStatus.label}
                        </span>
                      </div>

                      {/* Info row */}
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span>{app.intake_data?.project_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Business'}</span>
                        <span>•</span>
                        <span>{app.intake_data?.location_details?.operating_zone || 'Unknown Zone'}</span>
                        <span>•</span>
                        <span>{new Date(app.created_at).toLocaleDateString()}</span>
                      </div>

                      {/* Cost & Checklist info */}
                      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {estimatedCost > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <DollarSign size={13} style={{ color: 'var(--color-warning)' }} />
                            Est. ${estimatedCost.toLocaleString()}
                          </span>
                        )}
                        {totalChecklistCount > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <ListChecks size={13} style={{ color: pendingChecklistCount === 0 ? 'var(--color-success)' : 'var(--color-info)' }} />
                            {pendingChecklistCount === 0
                              ? 'All tasks complete 🎉'
                              : `${pendingChecklistCount} remaining task${pendingChecklistCount !== 1 ? 's' : ''}`}
                          </span>
                        )}
                        {totalChecklistCount > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={13} style={{ color: 'var(--color-info)' }} />
                            ~{Math.max(2, Math.ceil((estimatedCost / 1000) * 0.5))} wks
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <button
                        onClick={(e) => handleDelete(e, app.id)}
                        disabled={deletingId === app.id.toString()}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: '0.5rem', color: 'var(--color-text-muted)',
                          transition: 'color 0.2s',
                        }}
                        title="Delete analysis"
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                      >
                        <Trash2 size={18} />
                      </button>

                      <ChevronRight size={20} style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}