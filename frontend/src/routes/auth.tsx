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
          style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--color-accent-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                border: '1px solid rgba(124,92,252,0.3)',
              }}
            >
              <UserCircle size={24} style={{ color: 'var(--color-accent)' }} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {isLogin ? 'Welcome Back' : 'Create an Account'}
            </h1>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '0.9rem',
                marginTop: '0.5rem',
              }}
            >
              {isLogin
                ? 'Sign in to access your permit dashboard'
                : 'Sign up to save your business analyses'}
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                fontSize: '0.85rem',
                marginBottom: '1.5rem',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              {error}
            </div>
          )}

          {message && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'var(--color-success-bg)',
                color: 'var(--color-success)',
                fontSize: '0.85rem',
                marginBottom: '1.5rem',
                border: '1px solid rgba(34,197,94,0.2)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{message}</span>
            </div>
          )}

          <form
            onSubmit={handleEmailAuth}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                    borderRadius: '8px',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    opacity: loading ? 0.6 : 1,
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                  }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                    borderRadius: '8px',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    opacity: loading ? 0.6 : 1,
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                marginTop: '0.5rem',
                justifyContent: 'center',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading
                ? 'Processing...'
                : isLogin
                  ? 'Sign In'
                  : 'Create Account'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div
            style={{
              margin: '1.5rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          </div>

          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="btn-secondary"
            style={{
              width: '100%',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              opacity: loading ? 0.7 : 1,
            }}
          >
            Continue with Google
          </button>

          <p
            style={{
              textAlign: 'center',
              fontSize: '0.85rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setError(null)
                setMessage(null)
              }}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-accent)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </main>

      <SiteFooter />
    </div>
  )
}
