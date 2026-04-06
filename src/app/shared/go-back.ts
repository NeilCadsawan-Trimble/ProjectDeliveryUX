import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationHistoryService } from '../shell/services/navigation-history.service';

export interface BackInfo {
  label: string;
  route: string;
}

/**
 * Creates back-navigation helpers from NavigationHistoryService.
 * Must be called in an injection context.
 */
export function useBackNavigation() {
  const router = inject(Router);
  const navHistory = inject(NavigationHistoryService);
  const backInfo = navHistory.getBackInfo();
  const backLabel = 'Back to ' + backInfo.label;

  function goBack(): void {
    const route = backInfo.route;
    if (route.includes('?')) {
      const [path, query] = route.split('?');
      const qp: Record<string, string> = {};
      for (const pair of query.split('&')) {
        const [k, v] = pair.split('=');
        if (k) qp[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
      }
      router.navigate([path || '/'], { queryParams: qp });
    } else {
      router.navigate([route]);
    }
  }

  return { backLabel, goBack };
}
