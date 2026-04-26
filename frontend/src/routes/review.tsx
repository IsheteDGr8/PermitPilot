import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ArrowRight,
  Clock,
  DollarSign,
  FileText,
  CheckCircle2,
  Lightbulb,
  Plane,
  ArrowLeft,
  Check, // Added Check icon
  Sparkles,
  Download,
  X,
  User,
  Building,
  Wand2,
  File,
  MessageSquare
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SiteHeader, SiteFooter } from '@/components/site-chrome'
import { StatusBadge } from '@/components/status-badge'
import { getAgentIcon, getAgentColor } from '@/components/agent-icons'
import type { EvaluationResponse, IntakeData } from '@/lib/types'
import { updateApplication } from '@/lib/api' // Added API import

export const Route = createFileRoute('/review')({
  component: ReviewPage,
})

function ReviewPage() {
  const [result, setResult] = useState<EvaluationResponse | null>(null)
  const [intake, setIntake] = useState<IntakeData | null>(null)
  const [expandedAgents, setExpandedAgents] = useState<Set<number>>(new Set())
  // NEW STATES:
  const [resolvingAgent, setResolvingAgent] = useState<string | null>(null)
  const [resolutionText, setResolutionText] = useState<Record<string, string>>({})
  // NEW: Document Modal States
  const [docModalOpen, setDocModalOpen] = useState(false)
  const [activeDoc, setActiveDoc] = useState<any>(null)
  const [docProgress, setDocProgress] = useState(0)
  const [ownerName, setOwnerName] = useState('Business Owner')

  useEffect(() => {
    const savedResult = localStorage.getItem('permitResult')
    const savedIntake = localStorage.getItem('permitIntake')
    if (savedResult) setResult(JSON.parse(savedResult))
    if (savedIntake) setIntake(JSON.parse(savedIntake))
  }, [])

  const isFromPortal = typeof window !== 'undefined' && localStorage.getItem('permitFromPortal') === 'true';
  const backLink = isFromPortal ? '/portal' : '/start';
  const backText = isFromPortal ? 'Back to Portal' : 'New Application';

  const toggleAgent = (index: number) => {
    setExpandedAgents((prev) => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }

  // --- INTERACTIVE CHECKLIST LOGIC ---
  const handleToggleChecklist = async (index: number) => {
    if (!result || !result.checklist) return;

    // Create a copy of the checklist and flip the status
    const newChecklist = [...result.checklist];
    const isCompleted = newChecklist[index].status === 'completed';
    newChecklist[index].status = isCompleted ? 'pending' : 'completed';

    // 1. Optimistic UI Update (updates the screen instantly)
    const updatedResult = { ...result, checklist: newChecklist };
    setResult(updatedResult);
    localStorage.setItem('permitResult', JSON.stringify(updatedResult));

    // 2. Background Database Save
    try {
      await updateApplication(result.application_id, { checklist: newChecklist });
    } catch (error) {
      console.error("Failed to save checklist progress:", error);
    }
  }

  // --- RESOLVE CONFLICT LOGIC ---
  const handleResolve = async (agentName: string) => {
    if (!result || !intake || !resolutionText[agentName]) return;
    setResolvingAgent(agentName);

    try {
      const resolution = resolutionText[agentName];
      const { resolveConflict } = await import('@/lib/api'); // Dynamic import

      // Call our surgical backend route
      const updatedAgent = await resolveConflict(intake, agentName, resolution);

      // Swap the old agent data with the newly approved agent data!
      const newAgents = result.agents.map(a => a.agent === agentName ? updatedAgent : a);
      const newResult = { ...result, agents: newAgents };
      setResult(newResult);
      localStorage.setItem('permitResult', JSON.stringify(newResult));

      // Save the resolution context into the intake payload for future saves
      const newIntake = { ...intake, user_resolutions: { ...(intake as any).user_resolutions, [agentName]: resolution } };
      setIntake(newIntake);
      localStorage.setItem('permitIntake', JSON.stringify(newIntake));

      // Clear the text box
      setResolutionText(prev => ({ ...prev, [agentName]: '' }));
    } catch (error) {
      console.error("Failed to resolve:", error);
    } finally {
      setResolvingAgent(null);
    }
  }

  // --- DOCUMENT AUTO-FILL LOGIC ---
  const openDocModal = async (item: any) => {
    setActiveDoc(item)
    setDocModalOpen(true)
    setDocProgress(0)

    // Fetch the user's profile name we just created
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.user_metadata?.full_name) {
      setOwnerName(user.user_metadata.full_name)
    }

    // Fake the AI processing animation
    let progress = 0;
    const interval = setInterval(() => {
      progress += 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setDocProgress(progress);
    }, 300);
  }

  const handleDownloadForm = () => {
    // Generate a beautiful text document containing the extracted fields
    const content = `MUNICIPAL PERMIT DRAFT\nForm: ${activeDoc?.action}\n\n` +
      `-- APPLICANT INFO (From Profile) --\n` +
      `Owner Name: ${ownerName}\n\n` +
      `-- BUSINESS INFO (From Intake) --\n` +
      `Business Name: ${intake?.business_info?.business_name || 'Demo Business'}\n` +
      `Operating Zone: ${intake?.location_details?.operating_zone || 'N/A'}\n\n` +
      `-- AI ESTIMATED FIELDS --\n` +
      `Tax Classification: LLC / Sole Proprietorship\n` +
      `Estimated Start Date: TBD\n\n` +
      `* Please review and sign before submitting to the municipality. *`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Draft_${activeDoc?.action?.replace(/\s+/g, '_') || 'Form'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDocModalOpen(false);
  }

  const handleDownloadEmptyForm = () => {
    const content = `MUNICIPAL PERMIT BLANK FORM\nForm: ${activeDoc?.action}\n\n` +
      `-- APPLICANT INFO --\n` +
      `Owner Name: ________________________________\n\n` +
      `-- BUSINESS INFO --\n` +
      `Business Name: ________________________________\n` +
      `Operating Zone: ________________________________\n\n` +
      `-- ADDITIONAL FIELDS --\n` +
      `Tax Classification: ________________________________\n` +
      `Estimated Start Date: ________________________________\n\n` +
      `* Please fill out and sign before submitting to the municipality. *`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Blank_${activeDoc?.action?.replace(/\s+/g, '_') || 'Form'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDocModalOpen(false);
  }

  if (!result) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SiteHeader />
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center', padding: '3rem' }}>
          <div>
            <Plane size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>No evaluation found</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>Start a new permit application to see your results.</p>
            <Link to="/start" className="btn-primary">
              Start Application <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <SiteFooter />
      </div>
    )
  }

  const approvedCount = result.agents.filter((a) => a.status === 'approved').length
  const conflictCount = result.agents.filter((a) => a.status === 'conflict').length

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />

      <main style={{ flex: 1, maxWidth: '1000px', width: '100%', margin: '0 auto', padding: '2rem var(--spacing-page)' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Link to={backLink} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            <ArrowLeft size={14} /> {backText}
          </Link>

          <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
                  {intake?.business_info?.business_name || 'Business Application'}
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                  {intake?.location_details?.city && intake.location_details.city !== 'other' ? `${intake.location_details.city.charAt(0).toUpperCase() + intake.location_details.city.slice(1)} · ` : ''}
                  {intake?.project_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} · {intake?.location_details?.operating_zone || 'Unknown Location'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
                  background: result.overall_status === 'all_clear' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  border: `1px solid ${result.overall_status === 'all_clear' ? 'var(--color-success)' : 'var(--color-danger)'}`,
                  color: result.overall_status === 'all_clear' ? 'var(--color-success)' : 'var(--color-danger)',
                  fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem'
                }}>
                  {result.overall_status === 'all_clear' ? <><CheckCircle2 size={16} /> All Clear</> : <><AlertTriangle size={16} /> {conflictCount} Conflict{conflictCount !== 1 ? 's' : ''} Detected</>}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem' }}>
                  <Clock size={12} /> Evaluated in {result.evaluation_time_seconds}s
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>{approvedCount} Approved</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                <AlertTriangle size={16} style={{ color: 'var(--color-danger)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>{conflictCount} Conflicts</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                <DollarSign size={16} style={{ color: 'var(--color-warning)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>Est. ${result.total_estimated_cost?.toLocaleString() || '0'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                <FileText size={16} style={{ color: 'var(--color-info)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>{result.checklist?.length || 0} Checklist Items</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Cross-Agent Conflicts Banner */}
        {result.cross_agent_conflicts?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginBottom: '2rem' }}>
            {result.cross_agent_conflicts.map((conflict, i) => (
              <div key={i} className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '0.75rem', borderColor: 'var(--color-danger)', background: 'var(--color-danger-bg)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <AlertTriangle size={20} style={{ color: 'var(--color-danger)', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--color-danger)' }}>
                      Cross-Department Conflict: {conflict.agents.join(' ↔ ')}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                      {conflict.description}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {conflict.resolution_options?.map((opt, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.85rem' }}>
                          <Lightbulb size={14} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '2px' }} />
                          <span style={{ color: 'var(--color-text-primary)' }}>{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Agent Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Agent Evaluations</h2>

          {result.agents.map((agent, i) => {
            const Icon = getAgentIcon(agent.agent, agent.iconKey)
            const color = getAgentColor(agent.agent, agent.iconKey)
            const expanded = expandedAgents.has(i)

            return (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card" style={{ overflow: 'hidden' }}>
                {/* Agent Header */}
                <button
                  onClick={() => toggleAgent(i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', textAlign: 'left' }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', display: 'grid', placeItems: 'center', background: `${color}15`, border: `1px solid ${color}30`, flexShrink: 0 }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{agent.agent}</span>
                      <StatusBadge status={agent.status} />
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {agent.summary || 'Evaluation complete'}
                    </p>
                  </div>
                  {expanded ? <ChevronUp size={18} style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--color-text-muted)' }} />}
                </button>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid var(--color-border)' }}>
                        {/* Findings */}
                        {agent.findings?.length > 0 && (
                          <div style={{ marginTop: '1rem' }}>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                              Findings
                            </h4>
                            {agent.findings.map((f, fi) => (
                              <div key={fi} style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', background: f.result === 'fail' ? 'var(--color-danger-bg)' : f.result === 'warning' ? 'var(--color-warning-bg)' : 'var(--color-bg-elevated)', border: `1px solid ${f.result === 'fail' ? 'var(--color-danger)' : f.result === 'warning' ? 'var(--color-warning)' : 'var(--color-border)'}`, marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                  <span style={{ fontWeight: 600 }}>{f.rule_title || f.rule_id}</span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{f.citation}</span>
                                </div>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.83rem' }}>{f.explanation}</p>
                                {f.cost && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                    <DollarSign size={12} /> Est. cost: ${f.cost.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Agent-level Conflicts */}
                        {agent.conflicts?.length > 0 && (
                          <div style={{ marginTop: '1rem' }}>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                              Conflicts & Alternatives
                            </h4>
                            {agent.conflicts.map((c, ci) => (
                              <div key={ci} style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', marginBottom: '0.4rem' }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>{c.description}</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                  {c.alternatives?.map((alt, ai) => (
                                    <div key={ai} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', fontSize: '0.83rem' }}>
                                      <Lightbulb size={13} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '2px' }} />
                                      <span style={{ color: 'var(--color-text-primary)' }}>{alt}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* PROPOSE RESOLUTION UI */}
                        {['conflict', 'needs_info', 'needs-info', 'needs_more_info'].includes(agent.status) && (
                          <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <MessageSquare size={14} /> Negotiate with Agent
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                              Propose a fix or provide the missing information to clear this status.
                            </p>
                            <textarea
                              value={resolutionText[agent.agent] || ''}
                              onChange={(e) => setResolutionText({ ...resolutionText, [agent.agent]: e.target.value })}
                              placeholder="e.g., I will use electric appliances instead of propane..."
                              style={{ width: '100%', minHeight: '60px', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', marginBottom: '0.75rem', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                            />
                            <button
                              onClick={() => handleResolve(agent.agent)}
                              disabled={resolvingAgent === agent.agent || !resolutionText[agent.agent]}
                              className="btn-primary"
                              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', opacity: (!resolutionText[agent.agent] || resolvingAgent === agent.agent) ? 0.5 : 1 }}
                            >
                              {resolvingAgent === agent.agent ? 'Evaluating...' : 'Submit to Agent'}
                            </button>
                          </div>
                        )}

                        {/* Requirements */}
                        {agent.requirements?.length > 0 && (
                          <div style={{ marginTop: '1rem' }}>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                              Requirements
                            </h4>
                            {agent.requirements.map((r, ri) => (
                              <div key={ri} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', marginTop: '6px', flexShrink: 0, background: r.priority === 'required' ? 'var(--color-danger)' : r.priority === 'recommended' ? 'var(--color-warning)' : 'var(--color-info)' }} />
                                <div style={{ flex: 1 }}>
                                  <span>{r.action}</span>
                                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                    {r.estimated_cost != null && <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><DollarSign size={12} /> ${r.estimated_cost.toLocaleString()}</span>}
                                    {r.estimated_time && <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Clock size={12} /> {r.estimated_time}</span>}
                                    <span style={{ padding: '0.1rem 0.4rem', borderRadius: '4px', background: r.priority === 'required' ? 'var(--color-danger-bg)' : r.priority === 'recommended' ? 'var(--color-warning-bg)' : 'var(--color-info-bg)', color: r.priority === 'required' ? 'var(--color-danger)' : r.priority === 'recommended' ? 'var(--color-warning)' : 'var(--color-info)', fontWeight: 600 }}>
                                      {r.priority}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {/* INTERACTIVE CHECKLIST PREVIEW */}
        {result.checklist?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} style={{ color: 'var(--color-text-muted)' }} /> Dependency-Ordered Checklist
            </h2>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              {result.checklist.map((item, i) => {
                const isDone = item.status === 'completed';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 0', borderBottom: i < result.checklist.length - 1 ? '1px solid var(--color-border-subtle)' : 'none', opacity: isDone ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
                    <button
                      onClick={() => handleToggleChecklist(i)}
                      style={{ width: '24px', height: '24px', borderRadius: '4px', display: 'grid', placeItems: 'center', background: isDone ? 'var(--color-success)' : 'var(--color-bg-elevated)', border: isDone ? 'none' : '1px solid var(--color-border)', color: isDone ? 'var(--color-bg)' : 'var(--color-text-muted)', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s ease' }}
                    >
                      {isDone ? <Check size={14} strokeWidth={3} /> : <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{item.step}</span>}
                    </button>
                    <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => handleToggleChecklist(i)}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 500, textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--color-text-muted)' : 'var(--color-text-primary)', transition: 'color 0.2s ease' }}>
                        {item.action}
                      </p>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>{item.source_agent}</span>
                        {item.estimated_cost != null && <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><DollarSign size={12} /> ${item.estimated_cost.toLocaleString()}</span>}
                        {item.estimated_time && <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Clock size={12} /> {item.estimated_time}</span>}

                        {!isDone && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openDocModal(item); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto', transition: 'background 0.2s' }}
                          >
                            <Sparkles size={12} style={{ color: 'var(--color-accent)' }} /> Auto-Fill Form
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Totals */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Total Estimated Cost</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>
                    ${result.total_estimated_cost?.toLocaleString() || '0'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Estimated Time of Issuance</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>
                    Up to {Math.max(4, Math.ceil((result.checklist?.length || 0) * 1.5))} Weeks
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={backLink} className="btn-secondary">
            <ArrowLeft size={16} /> {backText}
          </Link>
        </div>
      </main>

      <SiteFooter />

      {/* DOCUMENT AUTO-FILL MODAL */}
      <AnimatePresence>
        {docModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', padding: '1rem' }}
            onClick={() => setDocModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="glass-card"
              style={{ width: '100%', maxWidth: '500px', background: 'var(--color-bg-card)', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
            >
              {/* Header */}
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={18} style={{ color: 'var(--color-text-primary)' }} /> Form Auto-Fill
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>{activeDoc?.action}</p>
                </div>
                <button onClick={() => setDocModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              {/* Body */}
              <div style={{ padding: '1.5rem', background: 'var(--color-bg)' }}>

                {/* Progress Bar */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: docProgress === 100 ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
                    <span>{docProgress === 100 ? 'Document Generated' : 'Analyzing context and mapping fields...'}</span>
                    <span>{docProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'var(--color-bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${docProgress}%`, height: '100%', background: docProgress === 100 ? 'var(--color-success)' : 'var(--color-text-primary)', transition: 'width 0.3s ease' }} />
                  </div>
                </div>

                {/* Extracted Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', opacity: docProgress > 30 ? 1 : 0, transition: 'opacity 0.5s' }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}><User size={14} style={{ color: 'var(--color-text-muted)' }} /> Owner Name</div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>{ownerName}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}><Building size={14} style={{ color: 'var(--color-text-muted)' }} /> Business Name</div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>{intake?.business_info?.business_name || 'Demo Business'}</span>
                  </div>

                  {/* AI Estimated Field */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                      <Wand2 size={14} /> Tax Classification (Estimated)
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>LLC / Sole Prop</span>
                  </div>

                </div>
              </div>

              {/* Footer Actions */}
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button onClick={() => setDocModalOpen(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button onClick={handleDownloadEmptyForm} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  <File size={16} /> Blank Form
                </button>
                <button onClick={handleDownloadForm} disabled={docProgress < 100} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                  <Download size={16} /> Auto-Filled Draft
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}