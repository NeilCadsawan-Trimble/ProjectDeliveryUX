/**
 * Persona-keyed catalog of contexts surfaced by the AI floating prompt's
 * Tools flyout (`<ai-composer-pill>` → "Tools" menu). Each entry keeps the
 * same shape as the original placeholder list: an optional Modus emblem
 * (Trimble Connect) or a Modus icon name plus a short label and one-line
 * description. Items are static demo content — they exist to show that
 * different roles see different workflows in the menu.
 *
 * Connect leads every persona's list (per the Modus reference flow); other
 * entries are ordered by how often the role is expected to reach for them.
 */
export interface PersonaToolContext {
  readonly id: string;
  /** Optional Modus icon (kebab-case-with-underscores). Use when `logoEmblem` is not set. */
  readonly icon?: string;
  /** When true, render the Trimble Connect emblem via `<modus-logo>` instead of an icon. */
  readonly logoEmblem?: boolean;
  readonly label: string;
  readonly description: string;
}

export const PERSONA_TOOL_CONTEXTS: Record<string, readonly PersonaToolContext[]> = {
  frank: [
    { id: 'connect', logoEmblem: true, label: 'Trimble Connect', description: 'Projects, files, and updates' },
    { id: 'portfolio', icon: 'dashboard', label: 'Portfolio dashboards', description: 'KPIs, margins, and risk' },
    { id: 'financial-reports', icon: 'bar_graph', label: 'Financial reports', description: 'Revenue, billings, and cash' },
    { id: 'schedule-overview', icon: 'gantt_chart', label: 'Schedule overview', description: 'Milestones and critical path' },
    { id: 'safety', icon: 'security', label: 'Safety & compliance', description: 'Incidents and certifications' },
    { id: 'customers', icon: 'building_corporate', label: 'Customer accounts', description: 'Owners, contracts, and renewals' },
    { id: 'docs', icon: 'folder_closed', label: 'Document repository', description: 'Master agreements and policies' },
    { id: 'payroll', icon: 'people_group', label: 'Payroll & timesheets', description: 'Hours by job and crew' },
    { id: 'photo-360', icon: 'image', label: 'Photo & 360 capture', description: 'Site media and walkthroughs' },
  ],
  bert: [
    { id: 'connect', logoEmblem: true, label: 'Trimble Connect', description: 'Projects, files, and updates' },
    { id: 'schedule', icon: 'gantt_chart', label: 'Schedule & milestones', description: 'Tasks, dependencies, baselines' },
    { id: 'rfi-submittals', icon: 'clipboard', label: 'RFIs & submittals', description: 'Requests and approvals' },
    { id: 'daily-reports', icon: 'document', label: 'Daily reports', description: 'Crews, weather, and progress' },
    { id: 'subcontractors', icon: 'building_corporate', label: 'Subcontractor management', description: 'Vendors and procurement' },
    { id: 'change-orders', icon: 'swap', label: 'Change orders', description: 'Pricing and approvals' },
    { id: 'punch-list', icon: 'list_bulleted', label: 'Issues & punch lists', description: 'Open items by trade' },
    { id: 'bim', icon: 'apps', label: 'Model coordination', description: 'Tekla, BIM, and clash context' },
    { id: 'safety', icon: 'security', label: 'Safety & compliance', description: 'Incidents and certifications' },
    { id: 'photo-360', icon: 'image', label: 'Photo & 360 capture', description: 'Site media and walkthroughs' },
  ],
  kelly: [
    { id: 'ap', icon: 'credit_card', label: 'Accounts payable', description: 'Invoices and bill pay' },
    { id: 'ar', icon: 'invoice', label: 'Accounts receivable', description: 'Billings and aging' },
    { id: 'contracts', icon: 'copy_content', label: 'Contracts & insurance', description: 'COIs and lien waivers' },
    { id: 'directory', icon: 'people_group', label: 'Vendor & contact directory', description: 'Companies and people' },
    { id: 'permits', icon: 'file_new', label: 'Permits & licenses', description: 'Filings and renewals' },
    { id: 'templates', icon: 'document', label: 'Document templates', description: 'Forms, letters, and policies' },
  ],
  dominique: [
    { id: 'connect', logoEmblem: true, label: 'Trimble Connect', description: 'Projects, files, and updates' },
    { id: 'field-machine', icon: 'location', label: 'Field & machine data', description: 'Layout files, control points, GNSS' },
    { id: 'bim', icon: 'apps', label: 'Model coordination', description: 'Tekla, BIM, and clash context' },
    { id: 'gis', icon: 'map', label: 'Geospatial & mapping', description: 'Surfaces, imagery, and boundaries' },
    { id: 'survey', icon: 'ruler', label: 'Site survey & topo', description: 'Existing conditions and as-builts' },
    { id: 'telemetry', icon: 'dashboard', label: 'Equipment telemetry', description: 'Earthmoving, paving, and drilling' },
    { id: 'daily-reports', icon: 'clipboard', label: 'Daily field reports', description: 'Crews, weather, and progress' },
    { id: 'photo-360', icon: 'image', label: 'Photo & 360 capture', description: 'Site media and walkthroughs' },
  ],
  pamela: [
    { id: 'connect', logoEmblem: true, label: 'Trimble Connect', description: 'Projects, files, and updates' },
    { id: 'takeoff', icon: 'ruler', label: 'Quantities & takeoff', description: 'Length, area, and counts' },
    { id: 'cost-db', icon: 'database', label: 'Cost database', description: 'Unit prices and assemblies' },
    { id: 'bids', icon: 'auto_target', label: 'Bid management', description: 'Active bids, addenda, due dates' },
    { id: 'quotes', icon: 'payment_instant', label: 'Vendor quotes', description: 'Subs and supplier pricing' },
    { id: 'history', icon: 'bar_graph_line', label: 'Historical cost data', description: 'Margins by trade and project' },
    { id: 'specs', icon: 'file', label: 'Specifications', description: 'Divisions, scope, and inclusions' },
    { id: 'gis', icon: 'map', label: 'Geospatial & mapping', description: 'Surfaces, imagery, and boundaries' },
  ],
};

/**
 * Fallback list used when the active persona slug isn't keyed in
 * {@link PERSONA_TOOL_CONTEXTS}. Defaults to Frank (the owner) so the menu
 * never renders empty.
 */
export const DEFAULT_PERSONA_TOOL_CONTEXTS = PERSONA_TOOL_CONTEXTS['frank'];
