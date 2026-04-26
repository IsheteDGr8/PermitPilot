import { Map, Heart, Flame, Building2, FileText, Sparkles } from 'lucide-react'

export const agentIcons: Record<string, typeof Map> = {
  zoning: Map,
  health: Heart,
  fire: Flame,
  building: Building2,
  licensing: FileText,
}

export function getAgentIcon(agentName: string, iconKey?: string) {
  // Try iconKey first
  if (iconKey && agentIcons[iconKey]) {
    return agentIcons[iconKey]
  }
  
  // Try matching by agent name
  const lower = agentName.toLowerCase()
  if (lower.includes('zoning')) return Map
  if (lower.includes('health')) return Heart
  if (lower.includes('fire')) return Flame
  if (lower.includes('building')) return Building2
  if (lower.includes('licensing') || lower.includes('business')) return FileText
  
  return Sparkles
}

export const agentColors: Record<string, string> = {
  zoning: '#3b82f6',
  health: '#22c55e',
  fire: '#ef4444',
  building: '#f59e0b',
  licensing: '#8b5cf6',
}

export function getAgentColor(agentName: string, iconKey?: string): string {
  if (iconKey && agentColors[iconKey]) {
    return agentColors[iconKey]
  }
  
  const lower = agentName.toLowerCase()
  if (lower.includes('zoning')) return agentColors.zoning
  if (lower.includes('health')) return agentColors.health
  if (lower.includes('fire')) return agentColors.fire
  if (lower.includes('building')) return agentColors.building
  if (lower.includes('licensing') || lower.includes('business')) return agentColors.licensing
  
  return '#7c5cfc'
}
