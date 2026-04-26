import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Plane,
  Map,
  Heart,
  Flame,
  Building2,
  FileText,
  Sparkles,
  MessageSquare,
  Shield,
  ListChecks,
  Zap,
} from 'lucide-react'
import { SiteHeader, SiteFooter } from '@/components/site-chrome'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

const agents = [
  { name: 'Zoning Authority', icon: Map, color: '#3b82f6', desc: 'Land use, districts & setbacks' },
  { name: 'Health Department', icon: Heart, color: '#22c55e', desc: 'Food safety & sanitation' },
  { name: 'Fire Marshal', icon: Flame, color: '#ef4444', desc: 'Fuel, suppression & life safety' },
  { name: 'Building Dept', icon: Building2, color: '#f59e0b', desc: 'Structural & electrical codes' },
  { name: 'Business Licensing', icon: FileText, color: '#8b5cf6', desc: 'Licenses, insurance & tax' },
  { name: 'Orchestrator', icon: Sparkles, color: '#7c5cfc', desc: 'Conflict detection & resolution' },
]

const steps = [
  {
    num: '01',
    title: 'Describe',
    desc: 'Tell us your business type, location, and operating details through a quick conversational form.',
    icon: MessageSquare,
    color: '#3b82f6',
  },
  {
    num: '02',
    title: 'Negotiate',
    desc: 'Five AI agents evaluate your application in parallel, catching cross-department conflicts before you submit.',
    icon: Shield,
    color: '#7c5cfc',
  },
  {
    num: '03',
    title: 'Execute',
    desc: 'Get a single, dependency-ordered checklist with exact costs, timelines, and links to every form you need.',
    icon: ListChecks,
    color: '#22c55e',
  },
]

function LandingPage() {

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />

      {/* Hero */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '6rem var(--spacing-page) 4rem',
        }}
      >
        {/* Background gradient orbs */}
        <div
          style={{
            position: 'absolute',
            top: '-200px',
            left: '-100px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,92,252,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-300px',
            right: '-150px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 1rem',
                borderRadius: '9999px',
                background: 'var(--color-accent-glow)',
                border: '1px solid rgba(124,92,252,0.3)',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
                color: 'var(--color-accent)',
                fontWeight: 500,
              }}
            >
              <Zap size={14} />
              Powered by Google Gemini AI
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                fontWeight: 900,
                lineHeight: 1.1,
                marginBottom: '1.5rem',
                letterSpacing: '-0.03em',
              }}
            >
              From 14 Weeks
              <br />
              to{' '}
              <span className="gradient-text">14 Minutes</span>
            </h1>

            <p
              style={{
                fontSize: '1.2rem',
                color: 'var(--color-text-secondary)',
                maxWidth: '650px',
                margin: '0 auto 2.5rem',
                lineHeight: 1.7,
              }}
            >
              The AI-powered civic permit navigator that replaces five confusing government websites
              with one conversational interface. Tell us what you want to open and where — we handle the rest.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/start" className="btn-primary" style={{ fontSize: '1.05rem', padding: '0.85rem 2rem' }}>
                Start a permit application
                <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Agent Council */}
      <section style={{ padding: '3rem var(--spacing-page) 4rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: '2.5rem' }}
          >
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
              The Agent Council
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', maxWidth: '550px', margin: '0 auto' }}>
              Five specialized AI agents evaluate your application simultaneously, each an expert in their domain.
            </p>
          </motion.div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem',
            }}
          >
            {agents.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="glass-card glass-card-hover"
                style={{ padding: '1.5rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-md)',
                      display: 'grid',
                      placeItems: 'center',
                      background: `${agent.color}15`,
                      border: `1px solid ${agent.color}30`,
                    }}
                  >
                    <agent.icon size={20} style={{ color: agent.color }} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{agent.name}</h3>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{agent.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        style={{
          padding: '4rem var(--spacing-page)',
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: '3rem' }}
          >
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
              How It Works
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem' }}>
              Three steps. Zero confusion. All automated.
            </p>
          </motion.div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="glass-card"
                style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-10px',
                    fontSize: '6rem',
                    fontWeight: 900,
                    color: 'rgba(255,255,255,0.03)',
                    lineHeight: 1,
                    pointerEvents: 'none',
                  }}
                >
                  {step.num}
                </div>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-md)',
                    display: 'grid',
                    placeItems: 'center',
                    background: `${step.color}15`,
                    border: `1px solid ${step.color}30`,
                    marginBottom: '1rem',
                  }}
                >
                  <step.icon size={24} style={{ color: step.color }} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{step.title}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '5rem var(--spacing-page)', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Plane size={40} style={{ color: 'var(--color-accent)', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
            Ready to fly through permits?
          </h2>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '1.05rem',
              marginBottom: '2rem',
              maxWidth: '500px',
              margin: '0 auto 2rem',
            }}
          >
            Start your application in minutes, not months.
          </p>
          <Link to="/start" className="btn-primary" style={{ fontSize: '1.05rem', padding: '0.85rem 2rem' }}>
            Get Started Free
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      <SiteFooter />
    </div>
  )
}
