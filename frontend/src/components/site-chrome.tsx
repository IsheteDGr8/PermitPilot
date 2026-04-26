import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "./theme-toggle";
import { Building2 } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </span>
          <span className="font-serif text-lg leading-none">
            Civic Permit Navigator
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/start"
            className="rounded-md px-3 py-1.5 text-text-secondary transition-colors hover:bg-accent hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-1.5 bg-accent text-foreground" }}
          >
            Start
          </Link>
          <Link
            to="/review"
            className="rounded-md px-3 py-1.5 text-text-secondary transition-colors hover:bg-accent hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-1.5 bg-accent text-foreground" }}
          >
            Review
          </Link>
          <Link
            to="/admin"
            className="rounded-md px-3 py-1.5 text-text-secondary transition-colors hover:bg-accent hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-1.5 bg-accent text-foreground" }}
          >
            City Admin
          </Link>
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-2 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <div>Civic Permit Navigator · Demo for Riverbend, OR</div>
        <div className="font-mono text-xs">
          v0.1 · Five agencies. One conversation. Zero contradictions.
        </div>
      </div>
    </footer>
  );
}
