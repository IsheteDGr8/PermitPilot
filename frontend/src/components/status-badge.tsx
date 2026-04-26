import type { AgentStatus } from '@/lib/types'
import { CheckCircle2, AlertTriangle, HelpCircle, XCircle } from 'lucide-react'

const statusConfig: Record<string, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  approved: {
    label: 'Approved',
    className: 'status-approved',
    Icon: CheckCircle2,
  },
  conflict: {
    label: 'Conflict',
    className: 'status-conflict',
    Icon: AlertTriangle,
  },
  'needs-info': {
    label: 'Needs Info',
    className: 'status-needs-info',
    Icon: HelpCircle,
  },
  error: {
    label: 'Error',
    className: 'status-error',
    Icon: XCircle,
  },
}

export function StatusBadge({ status }: { status: AgentStatus | string }) {
  const normalized = (status || 'error').toLowerCase()
  const config = statusConfig[normalized] || statusConfig.error

  return (
    <span
      className={config.className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.8rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}
    >
      <config.Icon size={14} />
      {config.label}
    </span>
  )
}
