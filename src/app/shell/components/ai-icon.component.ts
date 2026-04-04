import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

let nextId = 0;

@Component({
  selector: 'ai-icon',
  template: `
    @switch (variant()) {
      @case ('nav') {
        @if (isDark()) {
          <svg class="h-4 w-auto" fill="none" viewBox="0 0 887 982" xmlns="http://www.w3.org/2000/svg">
            <defs><radialGradient [attr.id]="gradDarkId" cx="18%" cy="18%" r="70%"><stop offset="0%" stop-color="hsl(300, 100%, 50%)" /><stop offset="50%" stop-color="#9933FF" /><stop offset="100%" stop-color="#0066CC" /></radialGradient></defs>
            <path d="m36.76 749.83v231.56l201.3-116.22c-77.25-16.64-147.52-56.92-201.3-115.34zm199.83-634.65-199.83-115.18v230.14c56.05-60.9 128.22-99.28 199.83-114.97m403.73 374.35c0-176.82-143.34-320.16-320.16-320.16s-320.17 143.33-320.17 320.16 143.34 320.16 320.16 320.16 320.16-143.34 320.16-320.16m45.08-114.58c23.68 75.15 23.76 156.75-.59 232.74l201.86-116.54c-9.54-5.51-189.55-109.44-201.26-116.2" fill="white"/>
            <path d="m320.13 489.53c0 142.28 115.34 257.62 257.62 257.62s257.62-115.34 257.62-257.62-115.34-257.62-257.62-257.62-257.62 115.34-257.62 257.62" [attr.fill]="'url(#' + gradDarkId + ')'" transform="translate(-256, 0)"/>
          </svg>
        } @else {
          <svg class="h-4 w-auto" fill="none" viewBox="0 0 887 982" xmlns="http://www.w3.org/2000/svg">
            <defs><linearGradient [attr.id]="gradLightId" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="20%" stop-color="hsl(300, 100%, 50%)" /><stop offset="60%" stop-color="#0066CC" /><stop offset="100%" stop-color="#0066CC" /></linearGradient></defs>
            <path d="m36.76 749.83v231.56l201.3-116.22c-77.25-16.64-147.52-56.92-201.3-115.34z" fill="#0066CC"/>
            <path d="m236.59 115.18-199.83-115.18v230.14c56.05-60.9 128.22-99.28 199.83-114.97z" fill="hsl(300, 100%, 50%)"/>
            <path d="m685.40 374.91c23.68 75.15 23.76 156.75-.59 232.74l201.86-116.54c-9.54-5.51-189.55-109.44-201.26-116.2z" fill="#0066CC"/>
            <path d="m577.75 489.53c0 142.28-115.34 257.62-257.62 257.62s-257.62-115.34-257.62-257.62 115.34-257.62 257.63-257.62 257.62 115.34 257.62 257.62m62.57-.44c0-176.82-143.34-320.16-320.16-320.16s-320.17 143.33-320.17 320.16 143.34 320.16 320.16 320.16 320.16-143.34 320.16-320.16" [attr.fill]="'url(#' + gradLightId + ')'"/>
          </svg>
        }
      }
      @case ('solid-white') {
        <svg [class]="sizeClass()" viewBox="0 0 887 982" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="m36.76 749.83v231.56l201.3-116.22c-77.25-16.64-147.52-56.92-201.3-115.34z" fill="white"/>
          <path d="m236.59 115.18-199.83-115.18v230.14c56.05-60.9 128.22-99.28 199.83-114.97z" fill="white"/>
          <path d="m685.40 374.91c23.68 75.15 23.76 156.75-.59 232.74l201.86-116.54c-9.54-5.51-189.55-109.44-201.26-116.2z" fill="white"/>
          <path d="m577.75 489.53c0 142.28-115.34 257.62-257.62 257.62s-257.62-115.34-257.62-257.62 115.34-257.62 257.63-257.62 257.62 115.34 257.62 257.62m62.57-.44c0-176.82-143.34-320.16-320.16-320.16s-320.17 143.33-320.17 320.16 143.34 320.16 320.16 320.16 320.16-143.34 320.16-320.16" fill="white"/>
        </svg>
      }
      @default {
        <svg [class]="sizeClass()" viewBox="0 0 887 982" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="m36.76 749.83v231.56l201.3-116.22c-77.25-16.64-147.52-56.92-201.3-115.34z" fill="#0066CC"/>
          <path d="m236.59 115.18-199.83-115.18v230.14c56.05-60.9 128.22-99.28 199.83-114.97z" fill="hsl(300, 100%, 50%)"/>
          <path d="m685.40 374.91c23.68 75.15 23.76 156.75-.59 232.74l201.86-116.54c-9.54-5.51-189.55-109.44-201.26-116.2z" fill="#0066CC"/>
          <path d="m577.75 489.53c0 142.28-115.34 257.62-257.62 257.62s-257.62-115.34-257.62-257.62 115.34-257.62 257.63-257.62 257.62 115.34 257.62 257.62m62.57-.44c0-176.82-143.34-320.16-320.16-320.16s-320.17 143.33-320.17 320.16 143.34 320.16 320.16 320.16 320.16-143.34 320.16-320.16" fill="url(#ai-grad-light)"/>
        </svg>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiIconComponent {
  readonly variant = input<'nav' | 'solid-white' | 'solid-colored'>('solid-colored');
  readonly size = input<'xs' | 'sm' | 'lg'>('sm');
  readonly isDark = input<boolean>(false);

  private readonly uid = nextId++;
  readonly gradDarkId = `ai-grad-dark-${this.uid}`;
  readonly gradLightId = `ai-grad-light-${this.uid}`;

  readonly sizeClass = computed(() => `ai-icon-${this.size()}`);
}
