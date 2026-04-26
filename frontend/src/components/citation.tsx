import { useState } from "react";
import { citations } from "@/data/scenario";
import { X, Copy, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  id: string;
  onOpen?: (id: string) => void;
};

export function CitationPill({ id, onOpen }: Props) {
  const c = citations[id];
  if (!c) return null;
  return (
    <button
      type="button"
      className="citation"
      onClick={() => onOpen?.(id)}
      title={c.title}
    >
      {c.code}
    </button>
  );
}

/** Render a string with [c1] tokens replaced by citation pills. */
export function ReasoningText({
  text,
  onOpen,
}: {
  text: string;
  onOpen: (id: string) => void;
}) {
  const parts = text.split(/(\[c\d+\])/g);
  return (
    <p className="text-[15px] leading-relaxed text-foreground/90">
      {parts.map((p, i) => {
        const m = p.match(/^\[(c\d+)\]$/);
        if (m) return <CitationPill key={i} id={m[1]} onOpen={onOpen} />;
        return <span key={i}>{p}</span>;
      })}
    </p>
  );
}

export function CitationPanel({
  openId,
  onClose,
}: {
  openId: string | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const c = openId ? citations[openId] : null;

  const copy = () => {
    if (!c) return;
    navigator.clipboard.writeText(`${c.code} — ${c.title}\n\n${c.text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AnimatePresence>
      {c && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-border bg-surface p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-mono text-sm font-medium text-primary">{c.code}</div>
                <h3 className="mt-1 text-xl">{c.title}</h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 rounded-lg border border-border bg-background p-4 font-mono text-[13px] leading-relaxed text-foreground/90">
              {c.text}
            </div>
            <button
              onClick={copy}
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy citation"}
            </button>
            <p className="mt-6 text-xs text-muted-foreground">
              Riverbend Municipal Code · Effective date 2025-01-01 · Demo scenario
            </p>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
