import { Link, useNavigate } from "@tanstack/react-router";
import { Compass, LogOut, Sun, Moon, User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function SiteHeader() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isDark, setIsDark] = useState(false);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  // Theme Initializer
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, width: '100%', borderBottom: '1px solid var(--color-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(12px)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', height: '60px', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', color: 'var(--color-text-primary)' }}>
          <span style={{ display: 'grid', width: '32px', height: '32px', placeItems: 'center', borderRadius: '8px', background: 'var(--color-accent)', color: 'white' }}>
            <Compass size={18} />
          </span>
          <span style={{ fontWeight: 700, letterSpacing: '-0.02em', fontSize: '1.1rem' }}>PermitPilot</span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
          {user ? (
            <>
              <Link to="/start" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>New Permit</Link>
              <Link to="/portal" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>My Portal</Link>
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                <User size={15} /> Profile
              </Link>
              <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                <LogOut size={15} /> Sign Out
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Login</Link>
          )}

          {/* Theme Toggle Button */}
          <div style={{ width: '1px', height: '20px', background: 'var(--color-border)' }}></div>
          <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'grid', placeItems: 'center' }}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', padding: '2rem 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.7 }}>
          <Compass size={14} /> <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>PermitPilot</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
          &copy; {new Date().getFullYear()} PermitPilot Inc. All rights reserved. Municipal licensing simplified.
        </p>
      </div>
    </footer>
  );
}