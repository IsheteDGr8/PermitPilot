import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Sparkles, Plane, Lightbulb, ListChecks } from 'lucide-react'
import { SiteHeader, SiteFooter } from '@/components/site-chrome'
import { agentIcons } from '@/components/agent-icons'
import { supabase } from '@/lib/supabase'
import { evaluatePermit } from '@/lib/api'

export const Route = createFileRoute('/start')({
  component: DualStartFlow,
})

const sidebarAgents = [
  { name: 'Zoning Authority', iconKey: 'zoning' },
  { name: 'Health Department', iconKey: 'health' },
  { name: 'Fire Marshal', iconKey: 'fire' },
  { name: 'Building Dept', iconKey: 'building' },
  { name: 'Business Licensing', iconKey: 'licensing' },
]

// The classic questions for the Guided Form
const questions = [
  { key: 'business_name', label: "What's the name of your business?", type: 'text', placeholder: "e.g., Maria's Tacos..." },
  {
    key: 'business_type', label: 'What type of business is this?', type: 'select', options: [
      { value: 'food_truck', label: 'Food Truck' }, { value: 'restaurant', label: 'Restaurant' }, { value: 'retail', label: 'Retail Store' }, { value: 'salon', label: 'Salon / Barbershop' }
    ]
  },
  {
    key: 'city', label: 'Which city are you operating in?', type: 'select', options: [
      { value: 'seattle', label: 'Seattle, WA' }, { value: 'austin', label: 'Austin, TX' }, { value: 'other', label: 'Other City' }
    ]
  },
  {
    key: 'zone', label: 'What type of area will you operate in?', type: 'select', options: [
      { value: 'downtown_c2', label: 'Downtown Commercial' }, { value: 'residential_adj', label: 'Near Residential / Parks' }, { value: 'industrial', label: 'Industrial Zone' }
    ]
  },
  {
    key: 'fuel_type', label: 'What is your primary cooking/operation fuel?', type: 'select', options: [
      { value: 'propane', label: 'Propane Gas' }, { value: 'electric', label: 'Electric' }, { value: 'none', label: 'None / NA' }
    ]
  },
  {
    key: 'employees', label: 'How many employees?', type: 'select', options: [
      { value: 'solo', label: 'Just me (1)' }, { value: 'small', label: 'Small Team (2-5)' }, { value: 'large', label: 'Large Team (10+)' }
    ]
  }
]

function DualStartFlow() {
  const navigate = useNavigate({ from: '/start' })
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [error, setError] = useState<string | null>(null)

  // UI State
  const [inputMode, setInputMode] = useState<'magic' | 'guided'>('magic')

  // Magic State
  const [description, setDescription] = useState('')

  // Guided State
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  // Auth Guard
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) navigate({ to: '/auth' })
    }
    checkAuth()
  }, [navigate])

  const executeEvaluation = async (payload: any) => {
    setIsProcessing(true)
    setError(null)
    setStatusText('Agents are evaluating municipal codes...')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const data = await evaluatePermit(payload, user?.id)
      localStorage.setItem("permitResult", JSON.stringify(data))
      localStorage.setItem("permitIntake", JSON.stringify(payload))
      navigate({ to: "/review" })
    } catch (err) {
      console.error('Evaluation failed:', err)
      setError("We hit a snag connecting to the Orchestrator. Is your backend running?")
      setIsProcessing(false)
    }
  }

  const handleMagicSubmit = async () => {
    if (!description.trim()) return
    setIsProcessing(true)
    setError(null)
    try {
      setStatusText('Extracting business details...')
      const parseRes = await fetch("https://permitpilot-nf2x.onrender.com/api/parse-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description })
      })

      if (!parseRes.ok) throw new Error("Failed to parse description")
      const extracted = await parseRes.json()
      const isFoodBiz = ['food_truck', 'restaurant', 'bakery'].includes(extracted.business_type)

      const payload = {
        application_id: `app-${Math.floor(Math.random() * 10000)}`,
        project_type: extracted.business_type || "retail",
        business_info: {
          business_name: extracted.business_name || "My Business",
          business_type: extracted.business_type || "retail",
          employees: extracted.employees === 'solo' ? 1 : 5
        },
        location_details: {
          city: extracted.city || "other",
          operating_zone: extracted.zone || "downtown_c2",
          proximity_to_park_feet: isFoodBiz ? 45 : 100
        },
        operations: {
          operating_hours: "9:00 AM - 5:00 PM",
          fuel_type: extracted.fuel_type || "none",
          equipment: [], serves_alcohol: false, outdoor_seating: false
        }
      }
      await executeEvaluation(payload)
    } catch (err) {
      setError("AI Extraction failed. Try switching to the Guided Form!")
      setIsProcessing(false)
    }
  }

  const handleGuidedSubmit = async () => {
    const isFoodBiz = ['food_truck', 'restaurant', 'bakery'].includes(answers.business_type)
    const payload = {
      application_id: `app-${Math.floor(Math.random() * 10000)}`,
      project_type: answers.business_type || "retail",
      business_info: {
        business_name: answers.business_name || "Demo Business",
        business_type: answers.business_type || "retail",
        employees: answers.employees === 'solo' ? 1 : 5
      },
      location_details: {
        city: answers.city || "other",
        operating_zone: answers.zone || "downtown_c2",
        proximity_to_park_feet: isFoodBiz ? 45 : 100
      },
      operations: {
        operating_hours: "9:00 AM - 5:00 PM",
        fuel_type: answers.fuel_type || "none",
        equipment: [], serves_alcohol: false, outdoor_seating: false
      }
    }
    await executeEvaluation(payload)
  }

  const currentQ = questions[step]
  const isGuidedDone = step >= questions.length

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />

      <main style={{ flex: 1, display: 'flex', maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '2rem', gap: '2rem' }}>

        {/* Agent Sidebar */}
        <aside style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '1rem' }} className="hidden-mobile">
          <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            Agent Council
          </h3>
          {sidebarAgents.map((a) => {
            const Icon = (agentIcons && agentIcons[a.iconKey as keyof typeof agentIcons]) || Sparkles;
            return (
              <div key={a.name} style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.75rem',
                borderRadius: 'var(--radius-sm)', transition: 'all 0.3s ease',
                opacity: isProcessing ? 1 : 0.4,
                background: isProcessing ? 'var(--color-accent-glow)' : 'transparent',
              }}>
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', display: 'grid', placeItems: 'center', background: isProcessing ? 'transparent' : 'var(--color-bg-elevated)' }}>
                  <Icon size={16} style={{ color: isProcessing ? 'var(--color-accent)' : 'var(--color-text-muted)' }} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: isProcessing ? 600 : 400, color: isProcessing ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                  {a.name}
                </span>
              </div>
            )
          })}
        </aside>

        {/* Main Input Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '500px' }}>

          {isProcessing ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '2.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {sidebarAgents.map((a, i) => {
                  const Icon = (agentIcons && agentIcons[a.iconKey as keyof typeof agentIcons]) || Sparkles;
                  return (
                    <motion.div
                      key={a.name}
                      animate={{
                        y: [0, -12, 0],
                        opacity: [0.4, 1, 0.4],
                        borderColor: ['var(--color-border)', 'var(--color-accent)', 'var(--color-border)']
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut"
                      }}
                      style={{
                        width: '60px', height: '60px', borderRadius: 'var(--radius-md)',
                        background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                        display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <Icon size={26} style={{ color: 'var(--color-accent)' }} />
                    </motion.div>
                  )
                })}
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>{statusText}</h2>
              <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0 auto', fontSize: '0.95rem' }}>
                Our municipal AI agents are evaluating your project against local zoning, fire, health, and building codes.
              </p>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

              {/* INPUT MODE TOGGLE */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'var(--color-bg-elevated)', padding: '0.35rem', borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
                <button
                  onClick={() => setInputMode('magic')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', background: inputMode === 'magic' ? 'var(--color-bg-card)' : 'transparent', color: inputMode === 'magic' ? 'var(--color-text-primary)' : 'var(--color-text-muted)', boxShadow: inputMode === 'magic' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none' }}
                >
                  <Sparkles size={16} style={{ color: inputMode === 'magic' ? 'var(--color-accent)' : 'inherit' }} /> Magic Input
                </button>
                <button
                  onClick={() => setInputMode('guided')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', background: inputMode === 'guided' ? 'var(--color-bg-card)' : 'transparent', color: inputMode === 'guided' ? 'var(--color-text-primary)' : 'var(--color-text-muted)', boxShadow: inputMode === 'guided' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none' }}
                >
                  <ListChecks size={16} style={{ color: inputMode === 'guided' ? 'var(--color-accent)' : 'inherit' }} /> Guided Form
                </button>
              </div>

              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.03em' }}>
                What are you building?
              </h1>

              {error && (
                <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  {error}
                </div>
              )}

              {inputMode === 'magic' ? (
                // --- MAGIC PATH UI ---
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: 1.5 }}>
                    Describe your business idea in plain English. Our AI will extract the requirements and run them past our municipal agents.
                  </p>
                  <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., I want to open a solo taco truck near a park in Austin, and I'll be cooking with propane..."
                      style={{ width: '100%', minHeight: '150px', background: 'transparent', border: 'none', color: 'var(--color-text-primary)', fontSize: '1.1rem', resize: 'vertical', outline: 'none', lineHeight: 1.6 }}
                      autoFocus
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                      <Lightbulb size={16} /> Try mentioning your business name, location type, city name, business type, etc.
                    </div>
                    <button onClick={handleMagicSubmit} disabled={!description.trim() || isProcessing} className="btn-primary" style={{ opacity: !description.trim() ? 0.5 : 1, padding: '0.85rem 2rem', fontSize: '1.05rem' }}>
                      Analyze Business <ArrowRight size={18} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                // --- GUIDED PATH UI ---
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {!isGuidedDone ? (
                    <div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-accent)', fontWeight: 700, marginBottom: '0.5rem' }}>
                        STEP {step + 1} OF {questions.length}
                      </p>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                        {currentQ.label}
                      </h2>

                      {currentQ.type === 'text' ? (
                        <input
                          type="text"
                          value={answers[currentQ.key] || ''}
                          onChange={(e) => setAnswers({ ...answers, [currentQ.key]: e.target.value })}
                          placeholder={currentQ.placeholder}
                          style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', outline: 'none', marginBottom: '2rem' }}
                          onKeyDown={(e) => { if (e.key === 'Enter' && answers[currentQ.key]) setStep(step + 1) }}
                          autoFocus
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                          {currentQ.options?.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => { setAnswers({ ...answers, [currentQ.key]: opt.value }); setTimeout(() => setStep(step + 1), 200); }}
                              style={{ padding: '1rem', textAlign: 'left', borderRadius: 'var(--radius-md)', border: `1px solid ${answers[currentQ.key] === opt.value ? 'var(--color-accent)' : 'var(--color-border)'}`, background: answers[currentQ.key] === opt.value ? 'var(--color-accent-glow)' : 'var(--color-bg-card)', color: 'var(--color-text-primary)', fontSize: '1.05rem', cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="btn-secondary" style={{ opacity: step === 0 ? 0.5 : 1 }}>
                          <ArrowLeft size={16} /> Back
                        </button>
                        <button onClick={() => setStep(step + 1)} disabled={!answers[currentQ.key]} className="btn-primary" style={{ opacity: !answers[currentQ.key] ? 0.5 : 1 }}>
                          Continue <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <ListChecks size={32} />
                      </div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>All Set!</h2>
                      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>Your data is ready for the orchestrator.</p>
                      <button onClick={handleGuidedSubmit} className="btn-primary" style={{ padding: '0.85rem 2.5rem', fontSize: '1.1rem' }}>
                        Evaluate Application <ArrowRight size={18} />
                      </button>
                      <br />
                      <button onClick={() => setStep(0)} style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--color-text-muted)', textDecoration: 'underline', cursor: 'pointer' }}>
                        Go back and edit
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

            </motion.div>
          )}

        </div>
      </main>
      <SiteFooter />
    </div>
  )
}