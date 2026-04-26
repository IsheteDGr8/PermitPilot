import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { agents } from "@/data/scenario";
import { agentIcons } from "@/components/agent-icons";

const BACKEND_URL = "http://localhost:8080";

export const Route = createFileRoute("/start")({
  head: () => ({
    meta: [
      { title: "Start your permit — Civic Permit Navigator" },
      {
        name: "description",
        content:
          "A short conversational intake. The agents wake up as you answer and pre-fill what they can.",
      },
      { property: "og:title", content: "Start your permit — Civic Permit Navigator" },
      {
        property: "og:description",
        content: "A short conversational intake. The agents pre-fill what they can.",
      },
    ],
  }),
  component: StartFlow,
});

type Question = {
  id: string;
  prompt: string;
  hint?: string;
  field: "text" | "choice" | "textarea";
  options?: string[];
  triggers: string[]; // agent ids that wake up
  fillKey: keyof typeof initialKnown;
};

const initialKnown = {
  business: "",
  truckType: "",
  zone: "",
  hours: "",
  employees: "",
  power: "",
};

const questions: Question[] = [
  {
    id: "q1",
    prompt: "What's the legal name of the business?",
    hint: "If you haven't formed an LLC yet, that's okay — use your DBA.",
    field: "text",
    triggers: ["licensing"],
    fillKey: "business",
  },
  {
    id: "q2",
    prompt: "What type of food truck is this?",
    field: "choice",
    options: ["Propane (grill / trompo)", "Electric only", "Diesel generator", "Wood-fired"],
    triggers: ["fire", "building"],
    fillKey: "truckType",
  },
  {
    id: "q3",
    prompt: "Where do you want to operate?",
    hint: "You can refine later — a neighborhood is enough for now.",
    field: "choice",
    options: ["Downtown (C-2)", "Industrial (M-1)", "Mixed-use (MU-2)", "Multiple districts"],
    triggers: ["zoning"],
    fillKey: "zone",
  },
  {
    id: "q4",
    prompt: "What hours do you intend to operate?",
    field: "choice",
    options: ["Lunch only (11–2:30)", "Dinner only (5–9)", "Lunch + dinner", "Late night (9 pm–2 am)"],
    triggers: ["zoning"],
    fillKey: "hours",
  },
  {
    id: "q5",
    prompt: "How will the truck draw power?",
    field: "choice",
    options: ["Shoreline at commissary + battery on-site", "Onboard generator < 5kW", "Onboard generator > 5kW"],
    triggers: ["building"],
    fillKey: "power",
  },
  {
    id: "q6",
    prompt: "How many employees, including yourself?",
    field: "choice",
    options: ["Just me", "2 (me + 1 part-time)", "3–5", "6 or more"],
    triggers: ["licensing", "health"],
    fillKey: "employees",
  },
];

const seedAnswers: typeof initialKnown = {
  business: "Maria's Tacos LLC",
  truckType: "Propane (grill / trompo)",
  zone: "Downtown (C-2)",
  hours: "Lunch only (11–2:30)",
  power: "Shoreline at commissary + battery on-site",
  employees: "2 (me + 1 part-time)",
};

function StartFlow() {
  const [step, setStep] = useState(0);
  const [known, setKnown] = useState(initialKnown);
  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();

  const total = questions.length;
  const done = step >= total;
  const current = !done ? questions[step] : null;

  const wokenAgents = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < step; i++) {
      questions[i].triggers.forEach((t) => set.add(t));
    }
    if (step >= 3) set.add("orchestrator");
    return set;
  }, [step]);

  const submitToBackend = async (answers: typeof initialKnown) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        application_id: `APP-${Date.now()}`,
        project_type: "food-truck",
        business_name: answers.business,
        truck_type: answers.truckType,
        operating_zone: answers.zone,
        operating_hours: answers.hours,
        power_source: answers.power,
        employee_count: answers.employees,
      };

      const response = await fetch(`${BACKEND_URL}/api/evaluate-permit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();
      localStorage.setItem("permitResult", JSON.stringify(result));
      navigate({ to: "/review" });
    } catch (err: any) {
      console.error("Failed to submit to backend:", err);
      setSubmitError(err.message || "Failed to connect to the backend.");
      setIsSubmitting(false);
    }
  };

  const advance = (value: string) => {
    if (!current) return;
    const newKnown = { ...known, [current.fillKey]: value };
    setKnown(newKnown);
    setDraft("");
    const nextStep = step + 1;
    setStep(nextStep);

    // If this was the last question, auto-submit
    if (nextStep >= total) {
      submitToBackend(newKnown);
    }
  };

  const back = () => {
    if (step === 0) return;
    setStep((s) => s - 1);
    setDraft("");
  };

  const useDemo = () => {
    setKnown(seedAnswers);
    setStep(total);
    submitToBackend(seedAnswers);
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <div className="mx-auto grid max-w-[1200px] gap-8 px-6 py-12 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
        {/* Left rail — agent council */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="text-xs uppercase tracking-[0.14em] text-text-secondary">
            Agent Council
          </div>
          <ul className="mt-4 space-y-1">
            {agents.map((a) => {
              const Icon = agentIcons[a.iconKey];
              const woke = wokenAgents.has(a.id);
              return (
                <li
                  key={a.id}
                  className={`flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors ${
                    woke ? "text-foreground" : "text-text-secondary/70"
                  }`}
                >
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${
                      woke
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-text-secondary/60"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex-1">{a.name}</span>
                  {woke ? (
                    <span className="pulse-dot relative inline-block h-1.5 w-1.5 rounded-full text-primary">
                      <span className="relative block h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-border" />
                  )}
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Center — questions */}
        <main className="min-h-[420px]">
          <div className="mb-6 flex items-center justify-between">
            <span className="font-mono text-xs text-text-secondary">
              {Math.min(step + 1, total)} / {total}
            </span>
            <button
              onClick={useDemo}
              className="text-xs text-primary underline-offset-4 hover:underline"
            >
              Skip — use Maria's Tacos demo
            </button>
          </div>

          <AnimatePresence mode="wait">
            {current ? (
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="rounded-xl border border-border bg-surface p-8"
              >
                <h1 className="text-3xl">{current.prompt}</h1>
                {current.hint && (
                  <p className="mt-2 text-sm text-text-secondary">{current.hint}</p>
                )}

                {current.field === "text" && (
                  <div className="mt-8">
                    <input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && draft.trim()) advance(draft.trim());
                      }}
                      placeholder="Type your answer…"
                      className="w-full rounded-md border border-border bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                )}

                {current.field === "choice" && (
                  <div className="mt-8 grid gap-2">
                    {current.options!.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => advance(opt)}
                        className="group flex items-center justify-between rounded-md border border-border bg-background px-4 py-3 text-left text-sm transition-colors hover:border-primary/50 hover:bg-accent"
                      >
                        <span>{opt}</span>
                        <ArrowRight className="h-4 w-4 -translate-x-1 text-text-secondary opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between">
                  <button
                    onClick={back}
                    disabled={step === 0}
                    className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  {current.field === "text" && (
                    <button
                      onClick={() => draft.trim() && advance(draft.trim())}
                      disabled={!draft.trim()}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-xl border border-border bg-surface p-8"
              >
                {isSubmitting ? (
                  <>
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Agents are analyzing…
                    </div>
                    <h1 className="mt-4 text-3xl">Waking up the Agent Council</h1>
                    <p className="mt-3 max-w-xl text-text-secondary">
                      Your answers are being cross-referenced against the municipal
                      code by the Zoning and Health agents. This usually takes 5–15 seconds.
                    </p>
                  </>
                ) : submitError ? (
                  <>
                    <div className="inline-flex items-center gap-2 rounded-full bg-conflict/10 px-3 py-1 text-xs font-medium text-conflict">
                      Connection error
                    </div>
                    <h1 className="mt-4 text-3xl">Couldn't reach the backend</h1>
                    <p className="mt-3 max-w-xl text-text-secondary">
                      {submitError}. Make sure the backend server is running on port 8080.
                    </p>
                    <button
                      onClick={() => submitToBackend(known)}
                      className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-95"
                    >
                      Retry <ArrowRight className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                      <Check className="h-3.5 w-3.5" /> Intake complete
                    </div>
                    <h1 className="mt-4 text-3xl">All six agents are ready.</h1>
                    <p className="mt-3 max-w-xl text-text-secondary">
                      They've cross-referenced your answers against the Riverbend
                      Municipal Code. Four agents are clear or close to clear; one
                      conflict needs your input. Let's review.
                    </p>
                    <Link
                      to="/review"
                      className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-95"
                    >
                      Open the Agent Council
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Right — what we know */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="text-xs uppercase tracking-[0.14em] text-text-secondary">
              What we know so far
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              {(
                [
                  ["Business", known.business],
                  ["Truck type", known.truckType],
                  ["District", known.zone],
                  ["Hours", known.hours],
                  ["Power", known.power],
                  ["Employees", known.employees],
                ] as const
              ).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-text-secondary">{k}</dt>
                  <dd
                    className={`mt-0.5 ${
                      v ? "text-foreground" : "text-text-secondary/40"
                    }`}
                  >
                    {v || "—"}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 border-t border-border pt-4 text-xs text-text-secondary">
              Pre-filling forms in the background as you answer.
            </div>
          </div>
        </aside>
      </div>

      <SiteFooter />
    </div>
  );
}
