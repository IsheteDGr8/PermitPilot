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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Compass className="h-4 w-4" />
          </span>
          <span className="font-medium tracking-wide">PermitPilot</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {user ? (
            <>
              <Link to="/start" className="text-text-secondary transition-colors hover:text-foreground">Start New Permit</Link>
              <Link to="/portal" className="text-text-secondary transition-colors hover:text-foreground">My Portal</Link>
              <button onClick={handleLogout} className="flex items-center gap-1.5 text-text-secondary transition-colors hover:text-red-400">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </>
          ) : (
            <Link to="/auth" className="rounded-full bg-primary px-4 py-1.5 text-primary-foreground transition-transform hover:scale-105">Login / Register</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-surface/50 py-12">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 px-6 sm:flex-row">
        <div className="flex items-center gap-2.5 opacity-80">
          <span className="grid h-6 w-6 place-items-center rounded bg-foreground text-background">
            <Compass className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm font-medium">PermitPilot</span>
        </div>
        <p className="text-xs text-text-secondary">
          A multi-agent demonstration. Not for actual municipal use.
        </p>
      </div>
    </footer>
  );
}