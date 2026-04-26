import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Sparkles, Plane } from 'lucide-react'
import { SiteHeader, SiteFooter } from '@/components/site-chrome'
import { agentIcons } from '@/components/agent-icons'
import { supabase } from '@/lib/supabase'
import { evaluatePermit } from '@/lib/api'

export const Route = createFileRoute('/start')({
  component: StartFlow,
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
  // ADD THIS NEW QUESTION
  {
    key: 'city',
    label: 'Which city are you operating in?',
    placeholder: 'Select your city',
    type: 'select',
    options: [
      { value: 'seattle', label: '🌲 Seattle, WA' },
      { value: 'austin', label: '🎸 Austin, TX' },
      { value: 'other', label: '🏙️ Other City (General Rules)' },
    ],
    wakesAgent: 'Zoning Authority',
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
]

const sidebarAgents = [
  { name: 'Zoning Authority', id: 'zoning', iconKey: 'zoning' },
  { name: 'Health Department', id: 'health', iconKey: 'health' },
  { name: 'Fire Marshal', id: 'fire', iconKey: 'fire' },
  { name: 'Building Dept', id: 'building', iconKey: 'building' },
  { name: 'Business Licensing', id: 'licensing', iconKey: 'licensing' },
]

function StartFlow() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate({ from: '/start' })

  const total = questions.length
  const done = step >= total
  const current = !done ? questions[step] : null

  // STEP 3 FIX: This is the Auth Guard. It checks if a valid session exists
  // as soon as the page loads. If not, it safely kicks them to the login screen.
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: '/auth' });
      }
    };
    checkAuth();
  }, [navigate]);

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

    // 1. Get the current logged-in user
    const { data: { user } } = await supabase.auth.getUser()

    const zoneMap: Record<string, { zone: string; parkDist: number }> = {
      downtown_c2: { zone: 'Downtown (C-2)', parkDist: 45 },
      commercial_c1: { zone: 'Neighborhood Commercial (C-1)', parkDist: 200 },
      industrial: { zone: 'Industrial / Mixed-Use', parkDist: 500 },
      residential_adj: { zone: 'Near Residential Area', parkDist: 150 },
    }

    const loc = zoneMap[finalAnswers.zone] || zoneMap.downtown_c2
    const isFoodBiz = ['food_truck', 'restaurant', 'bakery'].includes(finalAnswers.business_type)

    const payload = {
      application_id: `app-${Math.floor(Math.random() * 10000)}`,
      project_type: finalAnswers.business_type || "retail",
      business_info: {
        business_name: finalAnswers.business_name || "Demo Business",
        business_type: finalAnswers.business_type || "retail", // Added to match types.ts
        employees: finalAnswers.employees === 'solo' ? 1 : 5
      },
      location_details: {
        city: finalAnswers.city || 'other',
        operating_zone: loc.zone,
        proximity_to_park_feet: isFoodBiz ? loc.parkDist : 100
      },
      operations: {
        operating_hours: "9:00 AM - 5:00 PM", // Added to match types.ts
        fuel_type: finalAnswers.fuel_type || "none", // Matches the fuel_type question
        equipment: [], // Added to match types.ts
        serves_alcohol: false,
        outdoor_seating: false // Added to match types.ts
      }
    }

    try {
      const data = await evaluatePermit(payload, user?.id);

      localStorage.setItem("permitResult", JSON.stringify(data));
      localStorage.setItem("permitIntake", JSON.stringify(payload));

      navigate({ to: "/review" });
    } catch (err: unknown) {
      console.error('Agent evaluation failed:', err);
      setError("Failed to connect to the Orchestrator API. Is your backend running on port 8080?");
      setIsEvaluating(false);
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

  // Handle going back a step
  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />

      <main style={{ flex: 1, display: 'flex', maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '2rem', gap: '2rem' }}>
        {/* Sidebar — Agent Status */}
        <aside style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '1rem' }} className="hidden-mobile">
          <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            Agent Council
          </h3>
          {sidebarAgents.map((a) => {
            const Icon = (agentIcons && agentIcons[a.iconKey as keyof typeof agentIcons]) || Sparkles;
            const woke = isEvaluating || wokeAgents.has(a.name);

            return (
              <div
                key={a.name}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-sm)', transition: 'all 0.3s ease',
                  opacity: woke ? 1 : 0.4,
                  background: woke ? 'rgba(124, 92, 252, 0.1)' : 'transparent',
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', display: 'grid', placeItems: 'center', background: woke ? 'rgba(124, 92, 252, 0.2)' : 'var(--color-bg-elevated)' }}>
                  <Icon size={16} style={{ color: woke ? 'var(--color-accent)' : 'var(--color-text-muted)' }} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: woke ? 600 : 400, color: woke ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                  {a.name}
                </span>
              </div>
            )
          })}
        </aside>

        {/* Main Form Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '500px' }}>
          {isEvaluating && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '3rem' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
                <Plane size={48} style={{ color: 'var(--color-accent)' }} />
              </motion.div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Agents are evaluating...</h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>Five AI agents are analyzing your application in parallel.</p>
            </motion.div>
          )}

          {error && !isEvaluating && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', background: 'var(--color-danger-bg)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--color-danger)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {error}
            </motion.div>
          )}

          {!isEvaluating && !done && current && (
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Question {step + 1} of {total}</span>
                  </div>
                </div>

                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>{current.label}</h2>

                {current.type === 'text' && (
                  <div>
                    <input
                      type="text"
                      placeholder={current.placeholder}
                      value={answers[current.key] || ''}
                      autoFocus
                      onChange={(e) => setAnswers({ ...answers, [current.key]: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) handleAnswer(e.currentTarget.value.trim()) }}
                      style={{ width: '100%', padding: '1rem 1.25rem', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '1.1rem', outline: 'none' }}
                    />
                  </div>
                )}

                {current.type === 'select' && current.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {current.options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleAnswer(opt.value)}
                        className="glass-card glass-card-hover"
                        style={{ padding: '1rem 1.25rem', textAlign: 'left', cursor: 'pointer', fontSize: '1.05rem', color: 'var(--color-text-primary)' }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Back and Continue Buttons */}
                <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button
                    onClick={handleBack}
                    disabled={step === 0}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none',
                      color: step === 0 ? 'var(--color-border)' : 'var(--color-text-secondary)',
                      cursor: step === 0 ? 'default' : 'pointer', fontSize: '0.95rem', fontWeight: 500,
                    }}
                  >
                    <ArrowLeft size={18} /> Back
                  </button>

                  {current.type === 'text' && (
                    <button
                      onClick={() => {
                        const val = answers[current.key] || ''
                        if (val.trim()) handleAnswer(val.trim())
                      }}
                      disabled={!answers[current.key]?.trim()}
                      className="btn-primary"
                      style={{ opacity: !answers[current.key]?.trim() ? 0.5 : 1 }}
                    >
                      Continue <ArrowRight size={18} />
                    </button>
                  )}
                </div>

              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}