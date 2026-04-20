import { Routes, type CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { PersonaService } from './services/persona.service';
import { AuthService } from './services/auth.service';
import { collectAllExtraRoutes } from './data/persona-nav.config';

/**
 * Guard that requires Trimble ID authentication.
 * Stores the attempted URL and redirects to /login if not authenticated.
 */
const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isAuthenticated()) {
    return true;
  }
  authService.setReturnUrl(state.url);
  return router.createUrlTree(['/login']);
};

/**
 * Guard that validates the :persona route parameter.
 * Sets the active persona in PersonaService if valid, otherwise redirects to /select.
 */
const personaGuard: CanActivateFn = (route) => {
  const personaService = inject(PersonaService);
  const router = inject(Router);
  const slug = route.paramMap.get('persona');
  if (slug && PersonaService.isValidPersona(slug)) {
    personaService.setActivePersona(slug);
    return true;
  }
  return router.createUrlTree(['/select']);
};

/**
 * Application routes.
 *
 * Structure:
 * - /:persona/, /:persona/projects, /:persona/financials/*, /:persona/project/:slug : App shell (dashboard layout + page content)
 * - / : Redirects to /select
 */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login-page/login-page.component').then((m) => m.LoginPageComponent),
    title: 'Sign In',
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./pages/auth-callback/auth-callback.component').then((m) => m.AuthCallbackComponent),
    title: 'Signing In...',
  },
  { path: '', redirectTo: 'select', pathMatch: 'full' as const },
  {
    path: 'select',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/persona-select/persona-select.component').then(
        (m) => m.PersonaSelectComponent,
      ),
    title: 'Select Persona',
  },
  {
    path: ':persona',
    canActivate: [authGuard, personaGuard],
    children: [
      {
        path: 'project/:slug',
        loadComponent: () =>
          import('./pages/project-dashboard/project-slug-page.component').then((m) => m.ProjectSlugPageComponent),
        title: 'Project',
      },
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard-layout/dashboard-layout.component').then((m) => m.DashboardLayoutComponent),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/home-page/home-page.component').then((m) => m.HomePageComponent),
            title: 'Home',
          },
          {
            path: 'profile',
            loadComponent: () =>
              import('./pages/profile-page/profile-page.component').then((m) => m.ProfilePageComponent),
            title: 'My Profile',
          },
          {
            path: 'account-settings',
            loadComponent: () =>
              import('./pages/account-settings-page/account-settings-page.component').then((m) => m.AccountSettingsPageComponent),
            title: 'Account Settings',
          },
          {
            path: 'my-products',
            loadComponent: () =>
              import('./pages/my-products-page/my-products-page.component').then((m) => m.MyProductsPageComponent),
            title: 'My Products',
          },
          {
            path: 'projects',
            loadComponent: () =>
              import('./pages/projects-page/projects-page.component').then((m) => m.ProjectsPageComponent),
            title: 'Projects',
          },
          {
            path: 'financials',
            loadComponent: () =>
              import('./pages/financials-page/financials-shell.component').then((m) => m.FinancialsShellComponent),
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./pages/financials-page/financials-page.component').then((m) => m.FinancialsPageComponent),
                title: 'Financials',
              },
              {
                path: 'job-costs/:slug',
                loadComponent: () =>
                  import('./pages/financials-page/financials-page.component').then((m) => m.FinancialsPageComponent),
                title: 'Job costs',
              },
              {
                path: 'change-orders/:id',
                loadComponent: () =>
                  import('./pages/financials-page/financials-page.component').then((m) => m.FinancialsPageComponent),
                title: 'Change orders',
              },
              {
                path: 'estimates/:id',
                loadComponent: () =>
                  import('./pages/financials-page/financials-page.component').then((m) => m.FinancialsPageComponent),
                title: 'Estimates',
              },
              {
                path: 'invoices/:id',
                loadComponent: () =>
                  import('./pages/financials-page/financials-page.component').then((m) => m.FinancialsPageComponent),
                title: 'Invoices',
              },
              {
                path: 'payables/:id',
                loadComponent: () =>
                  import('./pages/financials-page/financials-page.component').then((m) => m.FinancialsPageComponent),
                title: 'Payables',
              },
              {
                path: 'purchase-orders/:id',
                loadComponent: () =>
                  import('./pages/financials-page/financials-page.component').then((m) => m.FinancialsPageComponent),
                title: 'Purchase orders',
              },
              {
                path: 'contracts/:id',
                loadComponent: () =>
                  import('./pages/financials-page/financials-page.component').then((m) => m.FinancialsPageComponent),
                title: 'Contracts',
              },
              {
                path: 'billing/:id',
                loadComponent: () =>
                  import('./pages/financials-page/financials-page.component').then((m) => m.FinancialsPageComponent),
                title: 'Billing',
              },
              {
                path: 'payroll/:id',
                loadComponent: () =>
                  import('./pages/financials-page/financials-page.component').then((m) => m.FinancialsPageComponent),
                title: 'Payroll',
              },
              {
                path: 'payroll-monthly/:month',
                loadComponent: () =>
                  import('./pages/financials-page/financials-page.component').then((m) => m.FinancialsPageComponent),
                title: 'Payroll',
              },
              {
                path: 'subcontract-ledger/:id',
                loadComponent: () =>
                  import('./pages/financials-page/financials-page.component').then((m) => m.FinancialsPageComponent),
                title: 'Subcontract ledger',
              },
              {
                path: 'gl-entries/:id',
                loadComponent: () =>
                  import('./pages/financials-page/financials-page.component').then((m) => m.FinancialsPageComponent),
                title: 'GL entries',
              },
              {
                path: 'gl-accounts/:code',
                loadComponent: () =>
                  import('./pages/financials-page/financials-page.component').then((m) => m.FinancialsPageComponent),
                title: 'GL accounts',
              },
              {
                path: 'cash-flow/:month',
                loadComponent: () =>
                  import('./pages/financials-page/financials-page.component').then((m) => m.FinancialsPageComponent),
                title: 'Cash flow',
              },
            ],
          },
          ...collectAllExtraRoutes(),
        ],
      },
    ],
  },
];
