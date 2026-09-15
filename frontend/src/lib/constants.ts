/**
 * CIVIC PULSE — Application constants
 */

// Pune Baner–University corridor center
export const MAP_CENTER: [number, number] = [18.5596, 73.7850];
export const MAP_ZOOM = 14;

// Severity colors — restrained professional palette
export const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#dc2626',  // red-600
  HIGH: '#ea580c',      // orange-600
  MODERATE: '#ca8a04',  // yellow-600
  LOW: '#2563eb',       // blue-600
};

export const SEVERITY_BG: Record<string, string> = {
  CRITICAL: 'rgba(220, 38, 38, 0.15)',
  HIGH: 'rgba(234, 88, 12, 0.15)',
  MODERATE: 'rgba(202, 138, 4, 0.15)',
  LOW: 'rgba(37, 99, 235, 0.15)',
};

// Status colors
export const STATUS_COLORS: Record<string, string> = {
  DETECTED: '#ea580c',
  ANALYZING: '#2563eb',
  ANALYZED: '#2563eb',
  SIMULATING: '#7c3aed',
  SIMULATED: '#7c3aed',
  RECOMMENDED: '#ca8a04',
  APPROVED: '#16a34a',
  IN_PROGRESS: '#2563eb',
  COMPLETED: '#16a34a',
  VERIFIED: '#16a34a',
  CLOSED: '#6b7280',
};

// Asset type icons (using text labels for prototype)
export const ASSET_TYPE_LABELS: Record<string, string> = {
  STORMWATER_DRAIN: 'Stormwater Drain',
  ROAD_SEGMENT: 'Road Segment',
  CULVERT: 'Culvert',
  MANHOLE: 'Manhole',
  PUMP_STATION: 'Pump Station',
  RETENTION_BASIN: 'Retention Basin',
};

// Asset condition colors
export const CONDITION_COLORS: Record<string, string> = {
  GOOD: '#16a34a',
  FAIR: '#2563eb',
  CAPACITY_CONSTRAINED: '#ca8a04',
  DEGRADED: '#ea580c',
  CRITICAL: '#dc2626',
};

// Evidence type labels
export const EVIDENCE_TYPE_LABELS: Record<string, string> = {
  RAINFALL: 'Rainfall',
  TERRAIN: 'Terrain',
  DRAINAGE: 'Drainage',
  ROAD_NETWORK: 'Road Network',
  HISTORICAL_RECURRENCE: 'Historical Recurrence',
  SATELLITE: 'Satellite',
  FIELD_OBSERVATION: 'Field Observation',
  IMAGE: 'Image Evidence',
  SENSOR: 'Sensor Data',
};

// Evidence type icons (emoji for prototype)
export const EVIDENCE_ICONS: Record<string, string> = {
  RAINFALL: '🌧️',
  TERRAIN: '🏔️',
  DRAINAGE: '🔧',
  ROAD_NETWORK: '🛣️',
  HISTORICAL_RECURRENCE: '📊',
  SATELLITE: '🛰️',
  FIELD_OBSERVATION: '👁️',
  IMAGE: '📷',
  SENSOR: '📡',
};

// Processing steps for analysis
export const ANALYSIS_STEPS = [
  'Ingesting incident signal',
  'Checking rainfall data',
  'Querying nearby infrastructure',
  'Comparing historical recurrence',
  'Evaluating terrain relationship',
  'Fusing supporting evidence',
  'Generating contributing-factor hypotheses',
];

// Processing steps for simulation
export const SIMULATION_STEPS = [
  'Preparing baseline conditions',
  'Running Scenario 01 — DO NOTHING',
  'Running Scenario 02 — CLEAN DRAIN',
  'Running Scenario 03 — DRAIN UPGRADE',
  'Comparing expected outcomes',
  'Ranking interventions',
];

// Processing steps for verification
export const VERIFICATION_STEPS = [
  'Loading before-condition evidence',
  'Loading after-condition evidence',
  'Aligning images',
  'Comparing physical condition',
  'Calculating evidence confidence',
];

// Navigation items
export const NAV_ITEMS = [
  { label: 'Overview', href: '/', icon: '◉' },
  { label: 'Incidents', href: '/incidents', icon: '⚠' },
  { label: 'Infrastructure', href: '/infrastructure', icon: '⬡' },
  { label: 'Simulations', href: '/simulations', icon: '◈' },
  { label: 'Work Orders', href: '/work-orders', icon: '☰' },
  { label: 'Verification', href: '/verification', icon: '✓' },
  { label: 'Insights', href: '/insights', icon: '◆' },
];

// Format currency in INR
export function formatINR(amount: number): string {
  if (amount === 0) return '₹0';
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

// Format confidence as percentage
export function formatConfidence(value: number | undefined | null): string {
  if (value == null) return '—';
  return `${Math.round(value)}%`;
}

// Format date
export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Format datetime
export function formatDateTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Time ago
export function timeAgo(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(dateStr);
}
