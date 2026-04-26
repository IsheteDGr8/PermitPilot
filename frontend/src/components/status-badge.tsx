import type { AgentStatus } from "@/data/scenario";
import { Check, AlertTriangle, CircleDashed, Loader2 } from "lucide-react";

export function StatusBadge({ status, compact = false }: { status: AgentStatus; compact?: boolean }) {
  const map: Record<AgentStatus, { label: string; cls: string; Icon: typeof Check }> = {
    approved: {
      label: "Approved",
      cls: "bg-success/10 text-success border-success/30",
      Icon: Check,
    },
    conflict: {
      label: "Conflict",
      cls: "bg-conflict/10 text-conflict border-conflict/30",
      Icon: AlertTriangle,
    },
    "needs-info": {
      label: "Needs info",
      cls: "bg-gold/15 text-gold-foreground border-gold/40 dark:text-gold",
      Icon: CircleDashed,
    },
    reasoning: {
      label: "Reasoning",
      cls: "bg-primary/10 text-primary border-primary/30",
      Icon: Loader2,
    },
  };
  const { label, cls, Icon } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      <Icon className={`h-3 w-3 ${status === "reasoning" ? "animate-spin" : ""}`} />
      {!compact && label}
    </span>
  );
}
