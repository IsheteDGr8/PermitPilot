// ============================================
// PermitPilot Shared Types
// ============================================

export type AgentStatus = 'approved' | 'conflict' | 'needs-info' | 'error';

export interface Finding {
  rule_id: string;
  rule_title: string;
  citation: string;
  result: 'pass' | 'fail' | 'warning' | 'info';
  explanation: string;
  cost: number | null;
}

export interface Conflict {
  rule_id: string;
  description: string;
  alternatives: string[];
}

export interface Requirement {
  action: string;
  estimated_cost: number | null;
  estimated_time: string;
  priority: 'required' | 'recommended' | 'optional';
  dependency: string | null;
}

export interface AgentResult {
  agent: string;
  iconKey: string;
  status: AgentStatus;
  summary: string;
  findings: Finding[];
  conflicts: Conflict[];
  requirements: Requirement[];
  error?: string;
}

export interface CrossAgentConflict {
  type: string;
  agents: string[];
  description: string;
  severity: 'high' | 'medium' | 'low';
  resolution_options: string[];
}

export interface ChecklistItem {
  step: number;
  action: string;
  source_agent: string;
  estimated_cost: number | null;
  estimated_time: string;
  priority: 'required' | 'recommended' | 'optional';
  dependency: string | null;
  status: string;
}

export interface EvaluationResponse {
  application_id: string;
  overall_status: 'all_clear' | 'conflicts_detected' | 'partial_evaluation' | 'error';
  evaluation_time_seconds: number;
  agents: AgentResult[];
  cross_agent_conflicts: CrossAgentConflict[];
  checklist: ChecklistItem[];
  total_estimated_cost: number;
  evaluated_at: string;
}

export interface IntakeData {
  application_id: string;
  project_type: string;
  business_info: {
    business_name: string;
    business_type: string;
    employees: number;
  };
  location_details: {
    operating_zone: string;
    proximity_to_park_feet: number;
    address?: string;
  };
  operations: {
    operating_hours: string;
    fuel_type: string;
    equipment: string[];
    serves_alcohol: boolean;
    outdoor_seating: boolean;
  };
}

// Demo data for "Maria's Tacos" scenario
export const DEMO_INTAKE: IntakeData = {
  application_id: `app-demo-${Date.now()}`,
  project_type: 'food_truck',
  business_info: {
    business_name: "Maria's Tacos",
    business_type: 'food_truck',
    employees: 3,
  },
  location_details: {
    operating_zone: 'Downtown (C-2)',
    proximity_to_park_feet: 45,
    address: '123 Main St, Downtown',
  },
  operations: {
    operating_hours: '10:00 AM - 8:00 PM',
    fuel_type: 'propane',
    equipment: ['grill', 'fryer', 'propane_tanks'],
    serves_alcohol: false,
    outdoor_seating: false,
  },
};
