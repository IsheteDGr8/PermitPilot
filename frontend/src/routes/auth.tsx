import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { KeyRound, Mail, ArrowRight, UserCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SiteHeader, SiteFooter } from '@/components/site-chrome'

export const Route = createFileRoute('/auth')({
  component: AuthPage,
})

function AuthPage() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // If the user is already logged in, redirect to portal
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate({ to: '/portal' })
      }
    })
  }, [navigate])

  // --- Email / Password Auth ---
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      if (isLogin) {
        // --- Sign In ---
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (authError) {
          // Provide user-friendly error messages
          if (authError.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please check your credentials and try again.')
          } else if (authError.message.includes('Email not confirmed')) {
            setError('Your email has not been confirmed yet. Please check your inbox for a confirmation link.')
          } else {
            setError(authError.message)
          }
          return
        }

        if (data.session) {
          navigate({ to: '/portal' })
        }
      } else {
        // --- Sign Up ---
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (authError) {
          if (authError.message.includes('already registered')) {
            setError('An account with this email already exists. Try signing in instead.')
          } else {
            setError(authError.message)
          }
          return
        }

        // Check if email confirmation is required
        // When confirmation is required: data.session is null, data.user exists with email_confirmed_at = null
        // When confirmation is NOT required: data.session is populated
        if (data.session) {
          // No confirmation needed — auto-logged in
          navigate({ to: '/portal' })
        } else if (data.user && !data.session) {
          // Email confirmation required
          setMessage(
            'Account created! Please check your email for a confirmation link, then come back and sign in.'
          )
          setIsLogin(true) // Switch to sign-in mode so they can log in after confirming
        }
      }
    } catch (err: unknown) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Auth error:', err)
    } finally {
      setLoading(false)
    }
  }

  // --- Google OAuth ---
  const handleGoogleAuth = async () => {
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/portal`,
        },
      })

      if (oauthError) {
        setError(oauthError.message)
        setLoading(false)
      }
      // Note: successful OAuth redirects the browser, so setLoading(false) isn't needed
    } catch (err) {
      setError('Failed to connect to Google. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />
      <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '2rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', textAlign: 'center' }}
        >
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '1px solid rgba(124,92,252,0.3)' }}>
              <UserCircle size={24} style={{ color: 'var(--color-accent)' }} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Welcome to PermitPilot</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Sign in to manage your business applications.
            </p>
          </div>

          {error && (
            <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '1rem' }}
          >
            {loading ? 'Connecting...' : 'Continue with Google'}
          </button>
        </motion.div>
      </main>
      <SiteFooter />
    </div>
  )
}
