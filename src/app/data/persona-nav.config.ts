import type { Route } from '@angular/router';
import type { ShellNavItem } from '../shell/layout/dashboard-shell.component';
import type { NavItem, SubnavConfig } from '../pages/project-dashboard/project-dashboard.config';
import {
  SIDE_NAV_ITEMS,
  RECORDS_SUB_NAV_ITEMS,
  FINANCIALS_SUB_NAV_ITEMS,
  SUBNAV_CONFIGS,
} from '../pages/project-dashboard/project-dashboard.config';

export interface PersonaNavConfig {
  shellSideNav: ShellNavItem[];
  projectSideNav: NavItem[];
  recordsSubNav: NavItem[];
  projectFinancialsSubNav: NavItem[];
  financialsPageSubNav: NavItem[];
  subnavConfigs: Record<string, SubnavConfig>;
  extraRoutes: Route[];
}

const DEFAULT_SHELL_NAV: ShellNavItem[] = [
  { value: 'home', label: 'Home', icon: 'home', route: '/' },
  { value: 'projects', label: 'Projects', icon: 'briefcase', route: '/projects' },
  { value: 'financials', label: 'Financials', icon: 'bar_graph', route: '/financials' },
];

const DEFAULT_FIN_PAGE_NAV: NavItem[] = [
  { value: 'overview', label: 'Overview', icon: 'dashboard' },
  { value: 'estimates', label: 'Estimates', icon: 'file' },
  { value: 'change-orders', label: 'Change Orders', icon: 'swap' },
  { value: 'job-costs', label: 'Job Costs', icon: 'bar_graph' },
  { value: 'job-billing', label: 'Job Billing', icon: 'invoice' },
  { value: 'accounts-receivable', label: 'Accounts Receivable', icon: 'document' },
  { value: 'accounts-payable', label: 'Accounts Payable', icon: 'credit_card' },
  { value: 'cash-management', label: 'Cash Management', icon: 'gantt_chart' },
  { value: 'general-ledger', label: 'General Ledger', icon: 'list_bulleted' },
  { value: 'purchase-orders', label: 'Purchase Orders', icon: 'shopping_cart' },
  { value: 'payroll', label: 'Payroll', icon: 'people_group' },
  { value: 'contracts', label: 'Contracts', icon: 'copy_content' },
  { value: 'subcontract-ledger', label: 'Subcontract Ledger', icon: 'clipboard' },
];

function buildPersonaNav(): PersonaNavConfig {
  return {
    shellSideNav: DEFAULT_SHELL_NAV.map(item => ({ ...item })),
    projectSideNav: SIDE_NAV_ITEMS.map(item => ({ ...item })),
    recordsSubNav: RECORDS_SUB_NAV_ITEMS.map(item => ({ ...item })),
    projectFinancialsSubNav: FINANCIALS_SUB_NAV_ITEMS.map(item => ({ ...item })),
    financialsPageSubNav: DEFAULT_FIN_PAGE_NAV.map(item => ({ ...item })),
    subnavConfigs: structuredClone(SUBNAV_CONFIGS),
    extraRoutes: [],
  };
}

function buildBertNav(): PersonaNavConfig {
  const nav = buildPersonaNav();
  nav.shellSideNav = nav.shellSideNav.filter(item => item.value !== 'financials');
  return nav;
}

function buildKellyNav(): PersonaNavConfig {
  const nav = buildPersonaNav();
  nav.shellSideNav = nav.shellSideNav.filter(item => item.value !== 'projects');
  return nav;
}

export const PERSONA_NAV: Record<string, PersonaNavConfig> = {
  frank: buildPersonaNav(),
  bert: buildBertNav(),
  kelly: buildKellyNav(),
  dominique: buildPersonaNav(),
};

/**
 * Collects all extraRoutes from every persona, deduplicated by path.
 * Used by app.routes.ts to register persona-unique routes in the router.
 */
export function collectAllExtraRoutes(): Route[] {
  const seen = new Set<string>();
  const routes: Route[] = [];
  for (const config of Object.values(PERSONA_NAV)) {
    for (const route of config.extraRoutes) {
      if (route.path && !seen.has(route.path)) {
        seen.add(route.path);
        routes.push(route);
      }
    }
  }
  return routes;
}

/**
 * Returns the PersonaNavConfig for a given persona slug,
 * falling back to frank if the slug is unknown.
 */
export function getPersonaNav(slug: string): PersonaNavConfig {
  return PERSONA_NAV[slug] ?? PERSONA_NAV['frank'];
}
