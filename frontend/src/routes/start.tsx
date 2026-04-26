import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Loader2, Sparkles, Plane } from 'lucide-react'
import { SiteHeader, SiteFooter } from '@/components/site-chrome'
import { getAgentIcon, getAgentColor } from '@/components/agent-icons'
import { evaluatePermit } from '@/lib/api'
import type { IntakeData } from '@/lib/types'
import { DEMO_INTAKE } from '@/lib/types'

export const Route = createFileRoute('/start')({
  component: IntakePage,
})

interface Question {
  key: string
  label: string
  placeholder: string
  type: 'text' | 'select'
  options?: { value: string; label: string }[]
  wakesAgent?: string
}

const questions: Question[] = [
  {
    key: 'business_name',
    label: "What's the name of your business?",
    placeholder: "e.g., Maria's Tacos, Urban Cuts Salon...",
    type: 'text',
  },
  {
    key: 'business_type',
    label: 'What type of business are you opening?',
    placeholder: 'Select your business type',
    type: 'select',
    options: [
      { value: 'food_truck', label: '🚚 Food Truck' },
      { value: 'restaurant', label: '🍽️ Restaurant' },
      { value: 'bakery', label: '🧁 Bakery / Café' },
      { value: 'salon', label: '💇 Hair / Beauty Salon' },
      { value: 'retail', label: '🛍️ Retail Store' },
      { value: 'mobile_vendor', label: '🛒 Mobile Vendor / Cart' },
    ],
    wakesAgent: 'Zoning Authority',
  },
  {
    key: 'zone',
    label: 'Where will you operate?',
    placeholder: 'Select your operating zone',
    type: 'select',
    options: [
      { value: 'downtown_c2', label: '🏙️ Downtown (C-2, near park)' },
      { value: 'commercial_c1', label: '🏪 Neighborhood Commercial (C-1)' },
      { value: 'industrial', label: '🏭 Industrial / Mixed-Use' },
      { value: 'residential_adj', label: '🏡 Near Residential Area' },
    ],
    wakesAgent: 'Fire Marshal',
  },
  {
    key: 'employees',
    label: 'How many employees will you have?',
    placeholder: 'Select team size',
    type: 'select',
    options: [
      { value: 'solo', label: '👤 Just me (solo operator)' },
      { value: 'small', label: '👥 2-5 employees' },
      { value: 'medium', label: '👥 6-15 employees' },
      { value: 'large', label: '🏢 16+ employees' },
    ],
    wakesAgent: 'Business Licensing',
  },
  {
    key: 'fuel_type',
    label: 'What fuel/cooking method will you use?',
    placeholder: 'Select your primary fuel source',
    type: 'select',
    options: [
      { value: 'propane', label: '🔥 Propane / LPG' },
      { value: 'electric', label: '⚡ Electric' },
      { value: 'natural_gas', label: '🔵 Natural Gas (piped)' },
      { value: 'none', label: '🚫 No cooking (retail/salon)' },
    ],
    wakesAgent: 'Health Department',
  },
  {
    key: 'hours',
    label: 'What are your planned operating hours?',
    placeholder: 'e.g., 10 AM - 8 PM',
    type: 'select',
    options: [
      { value: 'morning', label: '🌅 6 AM - 2 PM (Morning)' },
      { value: 'standard', label: '☀️ 10 AM - 8 PM (Standard)' },
      { value: 'evening', label: '🌙 4 PM - 12 AM (Evening)' },
      { value: 'extended', label: '🕐 6 AM - 12 AM (Extended)' },
    ],
    wakesAgent: 'Building Dept',
  },
]

const sidebarAgents = [
  { name: 'Zoning Authority', iconKey: 'zoning' },
  { name: 'Health Department', iconKey: 'health' },
  { name: 'Fire Marshal', iconKey: 'fire' },
  { name: 'Building Dept', iconKey: 'building' },
  { name: 'Business Licensing', iconKey: 'licensing' },
]

function IntakePage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate({ from: '/start' })

  const total = questions.length
  const done = step >= total
  const current = !done ? questions[step] : null

  // Track which agents are "awake"
  const wokeAgents = useMemo(() => {
    const woke = new Set<string>()
    for (let i = 0; i <= step && i < total; i++) {
      const q = questions[i]
      if (q.wakesAgent && answers[q.key]) {
        woke.add(q.wakesAgent)
      }
    }
    return woke
  }, [step, answers])

  const submitToAgents = async (finalAnswers: Record<string, string>) => {
    setIsEvaluating(true)
    setError(null)

    const zoneMap: Record<string, { zone: string; parkDist: number }> = {
      downtown_c2: { zone: 'Downtown (C-2)', parkDist: 45 },
      commercial_c1: { zone: 'Neighborhood Commercial (C-1)', parkDist: 200 },
      industrial: { zone: 'Industrial / Mixed-Use', parkDist: 500 },
      residential_adj: { zone: 'Near Residential Area', parkDist: 150 },
    }

    const employeeMap: Record<string, number> = {
      solo: 1, small: 3, medium: 10, large: 20,
    }

    const hoursMap: Record<string, string> = {
      morning: '6:00 AM - 2:00 PM',
      standard: '10:00 AM - 8:00 PM',
      evening: '4:00 PM - 12:00 AM',
      extended: '6:00 AM - 12:00 AM',
    }

    const loc = zoneMap[finalAnswers.zone] || zoneMap.downtown_c2
    const isFoodBiz = ['food_truck', 'restaurant', 'bakery', 'mobile_vendor'].includes(finalAnswers.business_type)

    const intakeData: IntakeData = {
      application_id: `app-${Date.now()}`,
      project_type: finalAnswers.business_type,
      business_info: {
        business_name: finalAnswers.business_name || 'My Business',
        business_type: finalAnswers.business_type,
        employees: employeeMap[finalAnswers.employees] || 1,
      },
      location_details: {
        operating_zone: loc.zone,
        proximity_to_park_feet: loc.parkDist,
      },
      operations: {
        operating_hours: hoursMap[finalAnswers.hours] || '10:00 AM - 8:00 PM',
        fuel_type: finalAnswers.fuel_type || 'none',
        equipment: finalAnswers.fuel_type === 'propane'
          ? ['grill', 'fryer', 'propane_tanks']
          : finalAnswers.fuel_type === 'electric'
            ? ['electric_grill', 'induction_cooktop']
            : [],
        serves_alcohol: false,
        outdoor_seating: false,
      },
    }

    try {
      const data = await evaluatePermit(intakeData)
      localStorage.setItem('permitResult', JSON.stringify(data))
      localStorage.setItem('permitIntake', JSON.stringify(intakeData))
      navigate({ to: '/review' })
    } catch (err: unknown) {
      console.error('Evaluation failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect to the evaluation API. Is the backend running?')
      setIsEvaluating(false)
    }
  }

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [current!.key]: value }
    setAnswers(newAnswers)

    if (step + 1 >= total) {
      submitToAgents(newAnswers)
    } else {
      setStep(step + 1)
    }
  }

  const handleDemo = () => {
    localStorage.setItem('permitIntake', JSON.stringify(DEMO_INTAKE))
    setIsEvaluating(true)
    evaluatePermit(DEMO_INTAKE)
      .then((data) => {
        localStorage.setItem('permitResult', JSON.stringify(data))
        navigate({ to: '/review' })
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Demo evaluation failed.')
        setIsEvaluating(false)
      })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />

      <main style={{ flex: 1, display: 'flex', maxWidth: '1200px', width: '100%', margin: '0 auto', padding: 'var(--spacing-page)', gap: '2rem' }}>
        {/* Sidebar — Agent Status */}
        <aside
          style={{
            width: '260px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            paddingTop: '1rem',
          }}
          className="hidden-mobile"
        >
          <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            Agent Council
          </h3>
          {sidebarAgents.map((a) => {
            const Icon = getAgentIcon(a.name, a.iconKey)
            const color = getAgentColor(a.name, a.iconKey)
            const woke = wokeAgents.has(a.name)
            return (
              <div
                key={a.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'all 0.3s ease',
                  opacity: woke ? 1 : 0.4,
                  background: woke ? `${color}10` : 'transparent',
                  border: `1px solid ${woke ? `${color}30` : 'transparent'}`,
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'grid',
                    placeItems: 'center',
                    background: woke ? `${color}20` : 'var(--color-bg-elevated)',
                  }}
                >
                  <Icon size={16} style={{ color: woke ? color : 'var(--color-text-muted)' }} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: woke ? 600 : 400, color: woke ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                  {a.name}
                </span>
              </div>
            )
          })}

          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <button
              onClick={handleDemo}
              disabled={isEvaluating}
              style={{
                width: '100%',
                padding: '0.6rem',
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-secondary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
            >
              <Sparkles size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.3rem' }} />
              Skip — use Maria's Tacos demo
            </button>
          </div>
        </aside>

        {/* Main Form Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '500px' }}>
          {/* Evaluating State */}
          {isEvaluating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '3rem' }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                style={{ display: 'inline-block', marginBottom: '1.5rem' }}
              >
                <Plane size={48} style={{ color: 'var(--color-accent)' }} />
              </motion.div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Agents are evaluating...
              </h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Five AI agents are analyzing your application in parallel.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' }}>
                {sidebarAgents.map((a, i) => {
                  const color = getAgentColor(a.name, a.iconKey)
                  return (
                    <motion.div
                      key={a.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.2 }}
                      className="shimmer"
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${color}30`,
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color,
                      }}
                    >
                      <Loader2 size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.3rem', animation: 'spin 1s linear infinite' }} />
                      {a.name}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {error && !isEvaluating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '1rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-danger-bg)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--color-danger)',
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Question Form */}
          {!isEvaluating && !done && current && (
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                {/* Progress */}
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                      Question {step + 1} of {total}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                      {Math.round(((step + 1) / total) * 100)}%
                    </span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--color-bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                    <motion.div
                      style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--color-accent), #a78bfa)',
                        borderRadius: '2px',
                      }}
                      initial={{ width: `${(step / total) * 100}%` }}
                      animate={{ width: `${((step + 1) / total) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
                  {current.label}
                </h2>

                {current.type === 'text' && (
                  <div>
                    <input
                      id="intake-input"
                      type="text"
                      placeholder={current.placeholder}
                      defaultValue={answers[current.key] || ''}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          handleAnswer(e.currentTarget.value.trim())
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '1rem 1.25rem',
                        background: 'var(--color-bg-elevated)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-text-primary)',
                        fontSize: '1.1rem',
                        fontFamily: 'inherit',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent)')}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                    />
                    <button
                      className="btn-primary"
                      style={{ marginTop: '1rem' }}
                      onClick={() => {
                        const input = document.getElementById('intake-input') as HTMLInputElement
                        if (input?.value.trim()) handleAnswer(input.value.trim())
                      }}
                    >
                      Continue <ArrowRight size={16} />
                    </button>
                  </div>
                )}

                {current.type === 'select' && current.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {current.options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleAnswer(opt.value)}
                        className="glass-card glass-card-hover"
                        style={{
                          padding: '1rem 1.25rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '1.05rem',
                          color: 'var(--color-text-primary)',
                          background: answers[current.key] === opt.value ? 'var(--color-accent-glow)' : undefined,
                          borderColor: answers[current.key] === opt.value ? 'var(--color-accent)' : undefined,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Back button */}
                {step > 0 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    style={{
                      marginTop: '1.5rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                    }}
                  >
                    <ArrowLeft size={14} />
                    Back
                  </button>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Answers Summary (bottom) */}
          {!isEvaluating && Object.keys(answers).length > 0 && (
            <div style={{ marginTop: '3rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                Your Answers
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {Object.entries(answers).map(([key, val]) => (
                  <span
                    key={key}
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.8rem',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {val}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
        }
      `}</style>

      <SiteFooter />
    </div>
  )
}
