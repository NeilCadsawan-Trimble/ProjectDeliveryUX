import { inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

/**
 * Creates a signal that stays in sync with a route parameter.
 * Must be called in an injection context (constructor or field initializer).
 */
export function routeParamSignal(paramName: string, fallback = ''): ReturnType<typeof signal<string>> {
  const route = inject(ActivatedRoute);
  const s = signal<string>(fallback);
  route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
    s.set(params.get(paramName) ?? fallback);
  });
  return s;
}
