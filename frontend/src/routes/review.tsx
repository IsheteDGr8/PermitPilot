import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Clock,
  Download,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import {
  agents,
  applicant,
  checklist,
  conflict,
  forms,
  citations,
} from "@/data/scenario";
import { agentIcons } from "@/components/agent-icons";
import { StatusBadge } from "@/components/status-badge";
import { CitationPanel, ReasoningText, CitationPill } from "@/components/citation";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Agent Council Review — Civic Permit Navigator" },
      {
        name: "description",
        content:
          "Six agents read the code, surface one conflict to reconcile, and hand back a dependency-ordered checklist with pre-filled forms.",
      },
      {
        property: "og:title",
        content: "Agent Council Review — Civic Permit Navigator",
      },
      {
        property: "og:description",
        content: "Five agencies. One conversation. Zero contradictions.",
      },
    ],
  }),
  component: Review,
});

type AgentDetail = {
  agency: string;
  status: "approved" | "conflict" | "needs-info";
  notes: string;
  citations?: string[];
  required_forms?: Array<{ form_name: string; url: string }>;
};

type UnifiedChecklistItem = {
  form_name: string;
  url: string;
};

type PermitResult = {
  status: string;
  conflict_detected: boolean;
  agent_details: AgentDetail[];
  unified_checklist: UnifiedChecklistItem[];
};

const reasoningPhrases = [
  "Cross-referencing §7.32 with §15.04…",
  "Resolving variance under §9.14.225…",
  "Sequencing inspections by dependency graph…",
  "Verifying commissary status under §8.20.030…",
];

function Review() {
  const [openCitation, setOpenCitation] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [chosen, setChosen] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState<string>(forms[0].id);
  const [reasoningPhrase, setReasoningPhrase] = useState(0);
  const [permitResult, setPermitResult] = useState<PermitResult | null>(null);

  useEffect(() => {
    const storedResult = localStorage.getItem("permitResult");
    if (storedResult) {
      try {
        const parsed = JSON.parse(storedResult);
        setPermitResult(parsed);
      } catch (e) {
        console.error("Failed to parse permitResult from localStorage:", e);
      }
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setReasoningPhrase((p) => (p + 1) % reasoningPhrases.length);
    }, 2400);
    return () => clearInterval(t);
  }, []);

  const phasesOrder: Array<typeof checklist[number]["phase"]> = [
    "Pre-application",
    "Documentation",
    "Inspections",
    "Submission",
  ];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <div className="mx-auto max-w-[1200px] px-6 py-10">
        {/* Applicant summary */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-text-secondary">
                Application
              </div>
              <h1 className="mt-1 text-3xl">
                {applicant.business}{" "}
                <span className="text-text-secondary"> · {applicant.permit}</span>
              </h1>
              <p className="mt-1 text-text-secondary">{applicant.summary}</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <div className="text-xs text-text-secondary">Owner</div>
                <div className="mt-0.5">{applicant.owner}</div>
              </div>
              <div>
                <div className="text-xs text-text-secondary">Jurisdiction</div>
                <div className="mt-0.5">{applicant.city}</div>
              </div>
              <div className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-center">
                <div className="text-xs text-text-secondary">
                  Estimated time to issuance
                </div>
                <div className="mt-0.5 font-serif text-xl">
                  {applicant.estDays} days
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conflict banner */}
        <div className="mt-8 rounded-xl border border-conflict/40 bg-conflict/5 p-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-md bg-conflict/15 text-conflict">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-conflict">
                Two interpretations to reconcile
              </div>
              <h2 className="mt-1 text-2xl">{conflict.title}</h2>
              <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-foreground/90">
                {conflict.description.split(/(§\d+\.\d+\.\d+)/g).map((part, i) =>
                  /^§\d+\.\d+\.\d+$/.test(part) ? (
                    <span key={i} className="citation">
                      {part}
                    </span>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {conflict.options.map((o, i) => {
              const isChosen = chosen === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => setChosen(o.id)}
                  className={`text-left rounded-lg border p-4 transition-all ${
                    isChosen
                      ? "border-primary bg-primary/5"
                      : "border-border bg-surface hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className="font-mono">Option {i + 1}</span>
                    {i === 0 && (
                      <span className="rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-sm font-medium">{o.title}</div>
                  <div className="mt-2 text-[13px] leading-relaxed text-text-secondary">
                    {o.detail}
                  </div>
                  <div className="mt-3 border-t border-border pt-2 text-[12px] italic text-foreground/80">
                    {o.tradeoff}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Agent Council Grid */}
        <div className="mt-12">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-2xl">Agent Council</h2>
              <p className="text-sm text-text-secondary">
                Each agent reads the code independently. Click a citation to read the source text.
              </p>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-text-secondary">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="reasoning-cursor">{reasoningPhrases[reasoningPhrase]}</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {permitResult && permitResult.agent_details ? (
              permitResult.agent_details.map((agentDetail, idx) => {
                const isZoningConflict =
                  agentDetail.agency === "Zoning Authority" &&
                  agentDetail.status === "conflict" &&
                  permitResult.conflict_detected;

                return (
                  <motion.div
                    key={agentDetail.agency}
                    layout
                    className={`rounded-xl border p-5 ${
                      isZoningConflict
                        ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                        : "border-border bg-surface"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/8 text-primary">
                          <AlertTriangle className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="font-medium">{agentDetail.agency}</div>
                          <div className="text-xs text-text-secondary">
                            {agentDetail.status === "conflict"
                              ? "Conflict Detected"
                              : agentDetail.status === "needs-info"
                              ? "Needs Information"
                              : "Approved"}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={agentDetail.status} />
                    </div>

                    <p className="mt-4 text-[14px] leading-relaxed text-foreground/90">
                      {agentDetail.notes}
                    </p>

                    {agentDetail.citations && agentDetail.citations.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {agentDetail.citations.map((citation) => (
                          <span
                            key={citation}
                            className="inline-block rounded-md bg-primary/8 px-2.5 py-1 text-[11px] font-medium text-primary"
                          >
                            {citation}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })
            ) : (
              agents.map((a) => {
                const Icon = agentIcons[a.iconKey];
                const isOpen = !!expanded[a.id];
                return (
                  <motion.div
                    key={a.id}
                    layout
                    className="rounded-xl border border-border bg-surface p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/8 text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="font-medium">{a.name} Agent</div>
                          <div className="text-xs text-text-secondary">
                            {a.role}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>

                    <p className="mt-4 text-[14px] leading-relaxed text-foreground/90">
                      {a.summary}
                    </p>

                    <button
                      onClick={() =>
                        setExpanded((e) => ({ ...e, [a.id]: !e[a.id] }))
                      }
                      className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80"
                    >
                      {isOpen ? "Hide reasoning" : "Show reasoning"}
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="reason"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 border-t border-border pt-3">
                            <ReasoningText
                              text={a.reasoning}
                              onOpen={setOpenCitation}
                            />
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {a.citationIds.map((id) => (
                                <CitationPill
                                  key={id}
                                  id={id}
                                  onOpen={setOpenCitation}
                                />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom — checklist + forms */}
        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section>
            <h2 className="text-2xl">Unified checklist</h2>
            <p className="text-sm text-text-secondary">
              Dependency-ordered. Submit when every box is green.
            </p>
            {permitResult && permitResult.unified_checklist ? (
              <div className="mt-5 space-y-3">
                {permitResult.unified_checklist.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 transition-all hover:border-primary hover:bg-primary/5"
                  >
                    <div>
                      <div className="text-sm font-medium">{item.form_name}</div>
                      <div className="text-xs text-text-secondary">
                        Click to download
                      </div>
                    </div>
                    <Download className="h-4 w-4 text-primary" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="mt-5 space-y-6">
                {phasesOrder.map((phase) => {
                  const items = checklist.filter((c) => c.phase === phase);
                  return (
                    <div key={phase}>
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
                          {phase}
                        </h3>
                        <div className="h-px flex-1 bg-border" />
                        <span className="font-mono text-[11px] text-text-secondary">
                          {items.length} items
                        </span>
                      </div>
                      <ul className="overflow-hidden rounded-xl border border-border bg-surface">
                        {items.map((item, i) => (
                          <li
                            key={item.id}
                            className={`flex items-center gap-4 px-4 py-3 ${
                              i > 0 ? "border-t border-border" : ""
                            }`}
                          >
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border bg-background font-mono text-[10px] text-text-secondary">
                              {item.id.slice(1)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm">{item.title}</div>
                              <div className="mt-0.5 flex items-center gap-3 text-xs text-text-secondary">
                                <span>{item.agency}</span>
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {item.estTime}
                                </span>
                                {item.dependsOn && (
                                  <span className="font-mono text-[11px]">
                                    ← depends on {item.dependsOn.join(", ")}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="font-mono text-xs text-text-secondary">
                              {item.fee}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="text-2xl">Pre-filled forms</h2>
            <p className="text-sm text-text-secondary">
              Each field shows the citation behind its value.
            </p>
            <div className="mt-5 space-y-3">
              {forms.map((f) => {
                const isOpen = openForm === f.id;
                return (
                  <div
                    key={f.id}
                    className="overflow-hidden rounded-xl border border-border bg-surface"
                  >
                    <button
                      onClick={() => setOpenForm(isOpen ? "" : f.id)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <div>
                        <div className="text-sm font-medium">{f.name}</div>
                        <div className="text-xs text-text-secondary">
                          {f.agency}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
                        Review & sign <ArrowRight className="h-3 w-3" />
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <dl className="border-t border-border bg-background/50 p-4 text-sm">
                            {f.fields.map((field) => (
                              <div
                                key={field.label}
                                className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 py-2 first:pt-0 last:pb-0"
                              >
                                <dt className="text-xs text-text-secondary">
                                  {field.label}
                                </dt>
                                <dd className="text-[13.5px]">
                                  <span>{field.value}</span>
                                  {field.citationId && (
                                    <span className="ml-2 align-middle">
                                      <button
                                        onClick={() =>
                                          setOpenCitation(field.citationId!)
                                        }
                                        className="citation"
                                        title={
                                          citations[field.citationId].title
                                        }
                                      >
                                        {citations[field.citationId].code}
                                      </button>
                                    </span>
                                  )}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {chosen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-xl border border-success/40 bg-success/5 p-4 text-sm"
              >
                <div className="font-medium text-success">
                  Resolution selected
                </div>
                <p className="mt-1 text-foreground/90">
                  The Orchestrator has updated the dependency graph and
                  re-sequenced the checklist accordingly.
                </p>
              </motion.div>
            )}
          </aside>
        </div>
      </div>

      <CitationPanel openId={openCitation} onClose={() => setOpenCitation(null)} />
      <SiteFooter />
    </div>
  );
}
