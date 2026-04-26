import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Plane, Lightbulb } from 'lucide-react'
import { SiteHeader, SiteFooter } from '@/components/site-chrome'
import { agentIcons } from '@/components/agent-icons'
import { supabase } from '@/lib/supabase'
import { evaluatePermit } from '@/lib/api'

export const Route = createFileRoute('/start')({
  component: MagicStartFlow,
})

const sidebarAgents = [
  { name: 'Zoning Authority', iconKey: 'zoning' },
  { name: 'Health Department', iconKey: 'health' },
  { name: 'Fire Marshal', iconKey: 'fire' },
  { name: 'Building Dept', iconKey: 'building' },
  { name: 'Business Licensing', iconKey: 'licensing' },
]

function MagicStartFlow() {
  const [description, setDescription] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate({ from: '/start' })

  // Auth Guard
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) navigate({ to: '/auth' })
    }
    checkAuth()
  }, [navigate])

  const handleMagicSubmit = async () => {
    if (!description.trim()) return
    setIsProcessing(true)
    setError(null)

    try {
      // Step 1: Magic Extraction
      setStatusText('Extracting business details...')
      const parseRes = await fetch("http://localhost:8080/api/parse-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description })
      })

      if (!parseRes.ok) throw new Error("Failed to parse description")
      const extracted = await parseRes.json()

      // Step 2: Map to the strict payload the Agents expect
      const { data: { user } } = await supabase.auth.getUser()
      const isFoodBiz = ['food_truck', 'restaurant', 'bakery'].includes(extracted.business_type)

      const payload = {
        application_id: `app-${Math.floor(Math.random() * 10000)}`,
        project_type: extracted.business_type || "retail",
        business_info: {
          business_name: extracted.business_name || "My Business",
          business_type: extracted.business_type || "retail",
          employees: extracted.employees === 'solo' ? 1 : extracted.employees === 'small' ? 5 : 15
        },
        location_details: {
          city: extracted.city || "other",
          operating_zone: extracted.zone || "downtown_c2",
          proximity_to_park_feet: isFoodBiz ? 45 : 100 // Hardcoded to 45 for food trucks to trigger that sweet Zoning conflict!
        },
        operations: {
          operating_hours: "9:00 AM - 5:00 PM",
          fuel_type: extracted.fuel_type || "none",
          equipment: [],
          serves_alcohol: false,
          outdoor_seating: false
        }
      }

      // Step 3: Run the Orchestrator
      setStatusText('Agents are evaluating municipal codes...')
      const data = await evaluatePermit(payload, user?.id)

      localStorage.setItem("permitResult", JSON.stringify(data))
      localStorage.setItem("permitIntake", JSON.stringify(payload))
      navigate({ to: "/review" })

    } catch (err: any) {
      console.error('Flow failed:', err)
      setError("We hit a snag connecting to the AI. Is your backend running?")
      setIsProcessing(false)
    }
  }

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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '3rem' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
                <Plane size={48} style={{ color: 'var(--color-accent)' }} />
              </motion.div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>{statusText}</h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>Five AI agents are analyzing your application in parallel.</p>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.03em' }}>
                What are you building?
              </h1>
              <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: 1.5 }}>
                Describe your business idea in plain English. Our AI will instantly extract the requirements and run them past five municipal regulatory agents.
              </p>

              {error && (
                <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  {error}
                </div>
              )}

              <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., I want to open a 3-person taco truck near a park in downtown Seattle, and I'll be cooking with propane..."
                  style={{
                    width: '100%', minHeight: '150px', background: 'transparent', border: 'none',
                    color: 'var(--color-text-primary)', fontSize: '1.1rem', resize: 'vertical', outline: 'none',
                    lineHeight: 1.6
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  <Lightbulb size={16} /> Try mentioning your city, fuel type, and location.
                </div>
                <button
                  onClick={handleMagicSubmit}
                  disabled={!description.trim() || isProcessing}
                  className="btn-primary"
                  style={{ opacity: !description.trim() ? 0.5 : 1, padding: '0.85rem 2rem', fontSize: '1.05rem' }}
                >
                  Analyze Business <ArrowRight size={18} />
                </button>
              </div>

            </motion.div>
          )}

        </div>
      </main>
      <SiteFooter />
    </div>
  )
}