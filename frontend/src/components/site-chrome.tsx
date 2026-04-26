import { Link, useNavigate } from '@tanstack/react-router'
import { Plane } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function SiteHeader() {
  const navigate = useNavigate()
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate({ to: '/auth' })
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        borderBottom: '1px solid var(--color-border)',
        background: 'rgba(10, 10, 15, 0.85)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 var(--spacing-page)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            color: 'var(--color-text-primary)',
          }}
        >
          <Plane size={24} style={{ color: 'var(--color-accent)' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Permit<span style={{ color: 'var(--color-accent)' }}>Pilot</span>
          </span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link
            to="/admin"
            style={{
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
          >
            Admin
          </Link>
          <Link
            to="/start"
            style={{
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
          >
            Start Permit
          </Link>
          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <Link
                to="/portal"
                style={{
                  color: 'var(--color-accent)',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'color 0.2s',
                }}
              >
                My Portal
              </Link>
              <button
                onClick={handleSignOut}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              style={{
                color: 'var(--color-accent)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'color 0.2s',
              }}
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--color-border)',
        padding: '2rem var(--spacing-page)',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        fontSize: '0.85rem',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Plane size={16} style={{ color: 'var(--color-accent)' }} />
          <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>PermitPilot</span>
        </div>
        <p>From 14 Weeks to 14 Minutes · AI-Powered Civic Permit Navigator</p>
        <p style={{ marginTop: '0.25rem' }}>Built with Google Gemini · {new Date().getFullYear()}</p>
      </div>
    </footer>
  )
}
