import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Building2 } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { agents, permitTypes } from "@/data/scenario";
import { agentIcons } from "@/components/agent-icons";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Civic Permit Navigator — Open in 14 days, not 14 weeks" },
      {
        name: "description",
        content:
          "A multi-agent system that guides you through municipal permitting. Five agencies negotiate in one conversation, with every recommendation cited to specific code.",
      },
      { property: "og:title", content: "Civic Permit Navigator" },
      {
        property: "og:description",
        content: "Five agencies. One conversation. Zero contradictions.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="topo-bg absolute inset-0 opacity-[0.04]" aria-hidden />
        <div className="relative mx-auto max-w-[1200px] px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs">
              <span className="pulse-dot relative inline-block h-1.5 w-1.5 rounded-full text-success">
                <span className="relative block h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              <span className="text-text-secondary">
                Now serving the City of Riverbend, OR
              </span>
            </div>
            <h1 className="text-5xl tracking-tight md:text-6xl">
              Open your food truck in <span className="text-primary">14 days</span>,
              <br className="hidden md:block" /> not 14 weeks.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
              Six specialist agents — Zoning, Building, Health, Fire, Business
              Licensing, and an Orchestrator — read the municipal code, negotiate
              the conflicts, and hand you a single signed packet.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/start"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95"
              >
                Start a permit application
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Building2 className="h-4 w-4" />
                I'm a city — see admin view
              </Link>
            </div>
          </div>

          {/* Agent council preview */}
          <div className="mt-16">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-sans text-xs font-medium uppercase tracking-[0.14em] text-text-secondary">
                The Agent Council
              </h2>
              <span className="font-mono text-xs text-text-secondary">
                live · 6 agents
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {agents.map((a, i) => {
                const Icon = agentIcons[a.iconKey];
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
                    className="group relative rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/8 text-primary">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-sm font-medium">{a.name}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
                      <span className="pulse-dot relative inline-block h-1 w-1 rounded-full text-primary">
                        <span className="relative block h-1 w-1 rounded-full bg-primary" />
                      </span>
                      Online
                    </div>
                    <div
                      className="pointer-events-none absolute -bottom-1 left-1/2 z-10 w-60 -translate-x-1/2 translate-y-full rounded-md border border-border bg-popover p-3 text-xs text-popover-foreground opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100"
                      role="tooltip"
                    >
                      <div className="font-medium">Reads</div>
                      <div className="mt-0.5 text-text-secondary">{a.reads}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <h2 className="text-3xl">How it works</h2>
          <p className="mt-2 text-text-secondary">
            Three phases. No back-and-forth between agencies.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                num: "01",
                title: "Describe",
                body: "Answer a short series of plain-language questions about what you want to do, where, and when. No PDF forms.",
              },
              {
                num: "02",
                title: "Negotiate",
                body: "The agents read each other's findings. Conflicts surface as two interpretations to reconcile, with concrete options — not as errors.",
              },
              {
                num: "03",
                title: "Execute",
                body: "Sign your pre-filled forms in one place. The Orchestrator submits them in dependency order to the right people on the right days.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="rounded-xl border border-border bg-surface p-6"
              >
                <div className="font-mono text-xs text-text-secondary">
                  {step.num}
                </div>
                <h3 className="mt-3 text-xl">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Permit types */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <h2 className="text-3xl">What can we navigate for you?</h2>
          <p className="mt-2 text-text-secondary">
            Pick a starting point. The intake adapts to the permit type.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {permitTypes.map((p) => (
              <Link
                key={p.id}
                to="/start"
                className="group flex max-w-sm flex-col rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-primary/40"
              >
                <span className="text-sm font-medium">{p.label}</span>
                <span className="mt-0.5 text-xs text-text-secondary">
                  {p.blurb}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section>
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-3xl">Every recommendation is cited.</h2>
              <p className="mt-3 text-text-secondary">
                The agents never invent rules. Every position links to the exact
                section of the municipal code it relies on. Hover, click, or copy
                the citation — it's a first-class object, not a footnote.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="text-xs uppercase tracking-wider text-text-secondary">
                Example
              </div>
              <p className="mt-3 text-[15px] leading-relaxed">
                The Fire Agent recommends a 10-foot clearance from any building
                opening — see <span className="citation">§9.14.220</span> — but
                allows a variance to 7 feet under{" "}
                <span className="citation">§9.14.225</span> with a UL-listed leak
                detection system installed.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
