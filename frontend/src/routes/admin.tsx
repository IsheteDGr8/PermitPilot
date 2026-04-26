import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import {
  TrendingDown,
  TrendingUp,
  Activity,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { CitationPanel, CitationPill } from "@/components/citation";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "City Admin — Civic Permit Navigator" },
      {
        name: "description",
        content:
          "Economic development director's view: applications in flight, conflict trends, and rulebook health for council review.",
      },
      { property: "og:title", content: "City Admin — Civic Permit Navigator" },
      {
        property: "og:description",
        content:
          "Where applicants get stuck, which code sections create friction, and what to clarify next.",
      },
    ],
  }),
  component: Admin,
});

const stats = [
  { label: "Applications in flight", value: "84", trend: "+12 this week", up: true },
  { label: "Avg. time to approval", value: "13.4 d", trend: "−6.1 d vs. 2024", up: false },
  { label: "Conflicts detected (30d)", value: "27", trend: "23 auto-resolved", up: true },
  { label: "Permits issued (YTD)", value: "612", trend: "+38% YoY", up: true },
];

const phaseFriction = [
  { phase: "Pre-application", level: 22, note: "Mostly commissary lookups" },
  { phase: "Documentation", level: 41, note: "Process flow uploads" },
  { phase: "Inspections", level: 78, note: "Fire ↔ Zoning clearance disputes" },
  { phase: "Submission", level: 14, note: "Smooth — auto-bundled" },
];

const recentDecisions = [
  {
    when: "08:14",
    agent: "Fire",
    summary: "Granted variance to 7 ft for cart vendor under awning canopy.",
    cite: "c7",
  },
  {
    when: "07:52",
    agent: "Zoning",
    summary: "Confirmed MU-2 late-operations endorsement for Ramen Otto.",
    cite: "c8",
  },
  {
    when: "Yesterday",
    agent: "Health",
    summary: "Required process flow for sous-vide preparation, Form 3-201.",
    cite: "c12",
  },
  {
    when: "Yesterday",
    agent: "Licensing",
    summary: "Auto-issued BL-MF-1 for sole-proprietor coffee cart.",
    cite: "c9",
  },
];

const permitMix = [
  { type: "Food Truck", pct: 38 },
  { type: "ADU", pct: 22 },
  { type: "Sidewalk Café", pct: 14 },
  { type: "Block Party", pct: 11 },
  { type: "Home Daycare", pct: 9 },
  { type: "Short-Term Rental", pct: 6 },
];

const rulebook = [
  {
    cite: "c6",
    cited: 47,
    note: "Most-cited section this month. Consistent application across 47 reviews.",
    flag: "ok",
  },
  {
    cite: "c7",
    cited: 31,
    note: "Variance is being applied 31× — consider codifying the 7 ft + leak-detection path as a standing rule.",
    flag: "review",
  },
  {
    cite: "c13",
    cited: 24,
    note: "Lottery sites in Downtown Overlay are the bottleneck. Consider expanding Schedule A.",
    flag: "review",
  },
  {
    cite: "c8",
    cited: 18,
    note: "Late-operations endorsement criteria are subjective. Recommend definitional clarification.",
    flag: "ambiguous",
  },
];

function Admin() {
  const [openCitation, setOpenCitation] = useState<string | null>(null);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-text-secondary">
              Economic Development Office · Riverbend, OR
            </div>
            <h1 className="mt-2 text-4xl">Permit operations</h1>
            <p className="mt-1 text-text-secondary">
              Wednesday, week 17 · Real-time view across all six agencies.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs">
            <Activity className="h-3.5 w-3.5 text-success" />
            All agents healthy · last sync 2 min ago
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-surface p-5">
              <div className="text-xs text-text-secondary">{s.label}</div>
              <div className="mt-2 font-serif text-3xl">{s.value}</div>
              <div
                className={`mt-2 inline-flex items-center gap-1 text-xs ${
                  s.up ? "text-success" : "text-primary"
                }`}
              >
                {s.up ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {s.trend}
              </div>
            </div>
          ))}
        </div>

        {/* Friction heatmap + permit mix */}
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl">Where applicants get stuck</h2>
                <p className="text-sm text-text-secondary">
                  Friction score by phase, last 30 days.
                </p>
              </div>
              <span className="font-mono text-xs text-text-secondary">
                lower is better
              </span>
            </div>
            <div className="mt-6 space-y-5">
              {phaseFriction.map((p) => (
                <div key={p.phase}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{p.phase}</span>
                    <span className="font-mono text-xs text-text-secondary">
                      {p.level}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${
                        p.level > 60
                          ? "bg-conflict"
                          : p.level > 30
                            ? "bg-gold"
                            : "bg-success"
                      }`}
                      style={{ width: `${p.level}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-text-secondary">{p.note}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-xl">Permit mix</h2>
            <p className="text-sm text-text-secondary">YTD by type</p>
            <div className="mt-5 space-y-3">
              {permitMix.map((p) => (
                <div key={p.type}>
                  <div className="flex justify-between text-sm">
                    <span>{p.type}</span>
                    <span className="font-mono text-xs text-text-secondary">
                      {p.pct}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${p.pct * 2.6}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Decisions log + Rulebook health */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="text-xl">Recent agent decisions</h2>
            </div>
            <ul className="mt-5 divide-y divide-border">
              {recentDecisions.map((d, i) => (
                <li key={i} className="flex items-start gap-3 py-3 first:pt-0">
                  <span className="font-mono text-xs text-text-secondary w-16 shrink-0">
                    {d.when}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="font-medium">{d.agent} Agent</span>{" "}
                      <span className="text-text-secondary">·</span>{" "}
                      {d.summary}
                    </div>
                    <div className="mt-1.5">
                      <CitationPill id={d.cite} onOpen={setOpenCitation} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-gold" />
              <h2 className="text-xl">Rulebook health</h2>
            </div>
            <p className="text-sm text-text-secondary">
              Sections worth bringing back to council.
            </p>
            <ul className="mt-5 space-y-4">
              {rulebook.map((r) => (
                <li
                  key={r.cite}
                  className="rounded-lg border border-border bg-background/40 p-4"
                >
                  <div className="flex items-center justify-between">
                    <CitationPill id={r.cite} onOpen={setOpenCitation} />
                    <span className="font-mono text-xs text-text-secondary">
                      cited {r.cited}× / 30d
                    </span>
                  </div>
                  <div className="mt-2 text-[13.5px] leading-relaxed">
                    {r.note}
                  </div>
                  <div className="mt-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        r.flag === "ok"
                          ? "bg-success/10 text-success"
                          : r.flag === "review"
                            ? "bg-gold/15 text-gold-foreground dark:text-gold"
                            : "bg-conflict/10 text-conflict"
                      }`}
                    >
                      {r.flag === "ok"
                        ? "Stable"
                        : r.flag === "review"
                          ? "Suggest review"
                          : "Ambiguous — clarify"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <CitationPanel openId={openCitation} onClose={() => setOpenCitation(null)} />
      <SiteFooter />
    </div>
  );
}
