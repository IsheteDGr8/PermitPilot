import { Link, useNavigate } from "@tanstack/react-router";
import { Compass, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function SiteHeader() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  // Listen for login/logout events automatically
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        borderBottom: '1px solid var(--color-border)',
        background: 'rgba(10, 10, 15, 0.85)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          height: '56px',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            textDecoration: 'none',
            color: 'var(--color-text-primary)',
            transition: 'opacity 0.2s',
          }}
        >
          <span
            style={{
              display: 'grid',
              width: '28px',
              height: '28px',
              placeItems: 'center',
              borderRadius: '8px',
              background: 'var(--color-accent)',
              color: 'white',
            }}
          >
            <Compass size={16} />
          </span>
          <span style={{ fontWeight: 600, letterSpacing: '0.02em' }}>PermitPilot</span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.9rem', fontWeight: 500 }}>
          {user ? (
            <>
              <Link
                to="/start"
                style={{
                  color: 'var(--color-text-secondary)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
              >
                New Permit
              </Link>
              <Link
                to="/portal"
                style={{
                  color: 'var(--color-text-secondary)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
              >
                My Portal
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
              >
                <LogOut size={15} /> Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="btn-primary"
              style={{
                padding: '0.45rem 1.25rem',
                fontSize: '0.85rem',
                borderRadius: '9999px',
              }}
            >
              Login / Register
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--color-border)',
        background: 'rgba(18, 18, 26, 0.5)',
        padding: '3rem 0',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          padding: '0 1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', opacity: 0.8 }}>
          <span
            style={{
              display: 'grid',
              width: '24px',
              height: '24px',
              placeItems: 'center',
              borderRadius: '4px',
              background: 'var(--color-text-primary)',
              color: 'var(--color-bg)',
            }}
          >
            <Compass size={14} />
          </span>
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>PermitPilot</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          A multi-agent demonstration. Not for actual municipal use.
        </p>
      </div>
    </footer>
  );
}