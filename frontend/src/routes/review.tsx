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
} from 'lucide-react'
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
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: result.overall_status === 'all_clear' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  border: `1px solid ${result.overall_status === 'all_clear' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  color: result.overall_status === 'all_clear' ? 'var(--color-success)' : 'var(--color-danger)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}>
                  {result.overall_status === 'all_clear' ? '✅ All Clear' : `⚠️ ${conflictCount} Conflict${conflictCount !== 1 ? 's' : ''} Detected`}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                  <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
                  Evaluated in {result.evaluation_time_seconds}s
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ marginBottom: '2rem' }}
          >
            {result.cross_agent_conflicts.map((conflict, i) => (
              <div
                key={i}
                className="glass-card"
                style={{
                  padding: '1.25rem 1.5rem',
                  marginBottom: '0.75rem',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  background: 'var(--color-danger-bg)', // Fixed for light mode
                }}
              >
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
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-card"
                style={{ overflow: 'hidden' }}
              >
                {/* Agent Header */}
                <button
                  onClick={() => toggleAgent(i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 1.25rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'grid',
                      placeItems: 'center',
                      background: `${color}15`,
                      border: `1px solid ${color}30`,
                      flexShrink: 0,
                    }}
                  >
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
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid var(--color-border)' }}>
                        {/* Findings */}
                        {agent.findings?.length > 0 && (
                          <div style={{ marginTop: '1rem' }}>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                              Findings
                            </h4>
                            {agent.findings.map((f, fi) => (
                              <div
                                key={fi}
                                style={{
                                  padding: '0.6rem 0.75rem',
                                  borderRadius: 'var(--radius-sm)',
                                  background: f.result === 'fail' ? 'var(--color-danger-bg)' : f.result === 'warning' ? 'var(--color-warning-bg)' : 'var(--color-bg-elevated)',
                                  border: `1px solid ${f.result === 'fail' ? 'rgba(239,68,68,0.2)' : f.result === 'warning' ? 'rgba(245,158,11,0.2)' : 'var(--color-border)'}`,
                                  marginBottom: '0.4rem',
                                  fontSize: '0.85rem',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                  <span style={{ fontWeight: 600 }}>{f.rule_title || f.rule_id}</span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                                    {f.citation}
                                  </span>
                                </div>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.83rem' }}>{f.explanation}</p>
                                {f.cost && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: '0.25rem', display: 'inline-block' }}>
                                    💰 Est. cost: ${f.cost.toLocaleString()}
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
                              <div
                                key={ci}
                                style={{
                                  padding: '0.75rem',
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'var(--color-danger-bg)',
                                  border: '1px solid rgba(239,68,68,0.2)',
                                  marginBottom: '0.4rem',
                                }}
                              >
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

                        {/* NEW: PROPOSE RESOLUTION UI */}
                        {(agent.status === 'conflict' || agent.status === 'needs_info') && (
                          <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--color-accent)' }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-accent)' }}>
                              💬 Negotiate with Agent
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                              Propose a fix or provide the missing information to clear this status.
                            </p>
                            <textarea
                              value={resolutionText[agent.agent] || ''}
                              onChange={(e) => setResolutionText({ ...resolutionText, [agent.agent]: e.target.value })}
                              placeholder="e.g., I will use electric appliances instead of propane..."
                              style={{ width: '100%', minHeight: '60px', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', marginBottom: '0.75rem', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                            />
                            <button
                              onClick={() => handleResolve(agent.agent)}
                              disabled={resolvingAgent === agent.agent || !resolutionText[agent.agent]}
                              className="btn-primary"
                              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', opacity: (!resolutionText[agent.agent] || resolvingAgent === agent.agent) ? 0.5 : 1 }}
                            >
                              {resolvingAgent === agent.agent ? 'Agent evaluating...' : 'Submit to Agent'}
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
                              <div
                                key={ri}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '0.5rem',
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'var(--color-bg-elevated)',
                                  border: '1px solid var(--color-border)',
                                  marginBottom: '0.3rem',
                                  fontSize: '0.85rem',
                                }}
                              >
                                <div style={{
                                  width: '6px', height: '6px', borderRadius: '50%', marginTop: '6px', flexShrink: 0,
                                  background: r.priority === 'required' ? 'var(--color-danger)' : r.priority === 'recommended' ? 'var(--color-warning)' : 'var(--color-info)',
                                }} />
                                <div style={{ flex: 1 }}>
                                  <span>{r.action}</span>
                                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                    {r.estimated_cost != null && <span>💰 ${r.estimated_cost.toLocaleString()}</span>}
                                    {r.estimated_time && <span>⏱️ {r.estimated_time}</span>}
                                    <span style={{
                                      padding: '0.1rem 0.4rem',
                                      borderRadius: '4px',
                                      background: r.priority === 'required' ? 'var(--color-danger-bg)' : r.priority === 'recommended' ? 'var(--color-warning-bg)' : 'var(--color-info-bg)',
                                      color: r.priority === 'required' ? 'var(--color-danger)' : r.priority === 'recommended' ? 'var(--color-warning)' : 'var(--color-info)',
                                      fontWeight: 600,
                                    }}>
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
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              📋 Dependency-Ordered Checklist
            </h2>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              {result.checklist.map((item, i) => {
                const isDone = item.status === 'completed';
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.75rem 0',
                      borderBottom: i < result.checklist.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                      opacity: isDone ? 0.6 : 1, // Dims the item when done
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <button
                      onClick={() => handleToggleChecklist(i)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        background: isDone ? 'var(--color-success)' : 'var(--color-accent-glow)',
                        border: isDone ? 'none' : '1px solid rgba(124,92,252,0.3)',
                        color: isDone ? 'white' : 'var(--color-accent)',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isDone ? <Check size={16} strokeWidth={3} /> : <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{item.step}</span>}
                    </button>
                    <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => handleToggleChecklist(i)}>
                      <p style={{
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        textDecoration: isDone ? 'line-through' : 'none',
                        color: isDone ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                        transition: 'all 0.2s ease'
                      }}>
                        {item.action}
                      </p>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                        <span>{item.source_agent}</span>
                        {item.estimated_cost != null && <span>💰 ${item.estimated_cost.toLocaleString()}</span>}
                        {item.estimated_time && <span>⏱️ {item.estimated_time}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Total cost */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--color-border)',
                fontWeight: 700,
              }}>
                <span>Total Estimated Cost</span>
                <span style={{ color: 'var(--color-warning)', fontSize: '1.1rem' }}>
                  ${result.total_estimated_cost?.toLocaleString() || '0'}
                </span>
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
    </div>
  )
}