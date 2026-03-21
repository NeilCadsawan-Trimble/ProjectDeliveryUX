import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ModusButtonComponent } from '../../components/modus-button.component';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import { componentDemos } from '../../data/component-demos';

interface Category {
  name: string;
  value: string;
}

const categories: Category[] = [
  { name: 'All', value: 'all' },
  { name: 'Forms', value: 'forms' },
  { name: 'Layout', value: 'layout' },
  { name: 'Navigation', value: 'navigation' },
  { name: 'Display', value: 'display' },
  { name: 'Feedback', value: 'feedback' },
  { name: 'Overlays', value: 'overlays' },
  { name: 'Data', value: 'data' },
];

/**
 * Components gallery page.
 *
 * Provides a navigation hub listing all available Modus component demos
 * organized by category with filtering and card grid layout.
 */
@Component({
  selector: 'app-components-gallery',
  imports: [CommonModule, RouterModule, ModusButtonComponent, ModusBadgeComponent],
  template: `
    <div class="max-w-6xl mx-auto p-8">
      <div class="text-center mb-12">
        <div class="text-4xl font-semibold mb-4 text-foreground">Modus Web Components</div>
        <div class="text-lg leading-relaxed text-foreground text-center">
          Explore all available Angular Modus Web Components.
        </div>
      </div>

      <!-- Category Filter -->
      <div class="mb-12 p-8 bg-card rounded-lg border-default">
        <div class="text-2xl font-semibold mb-4 text-foreground">Filter by Category</div>
        <div class="flex flex-wrap gap-2">
          @for (category of categories; track category.value) {
            <modus-button
              [color]="selectedCategory() === category.value ? 'secondary' : 'secondary'"
              [variant]="selectedCategory() === category.value ? 'filled' : 'outlined'"
              size="md"
              (buttonClick)="setCategory(category.value)"
            >
              {{ category.name }}
            </modus-button>
          }
        </div>
      </div>

      <!-- Components Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (component of filteredComponents(); track component.url) {
          <div
            class="bg-card rounded-lg p-6 hover:shadow-lg transition-all duration-200 border-default"
          >
            <div class="flex items-start justify-between mb-4">
              <div>
                <div class="text-xl font-semibold text-foreground mb-2">{{ component.name }}</div>
                <div class="text-sm text-muted-foreground mb-2">{{ component.category }}</div>
              </div>
              <div class="flex items-center gap-2">
                <modus-badge
                  [color]="component.status === 'ready' ? 'success' : 'warning'"
                  size="md"
                  variant="filled"
                >
                  {{ component.status === 'ready' ? 'Ready' : 'Demo' }}
                </modus-badge>
              </div>
            </div>

            <div class="text-foreground mb-4 text-sm leading-relaxed">
              {{ component.description }}
            </div>

            <div class="w-full">
              <modus-button
                color="primary"
                variant="filled"
                size="md"
                [fullWidth]="true"
                (buttonClick)="navigateTo(component.url)"
              >
                View Demo
              </modus-button>
            </div>
          </div>
        }
      </div>

      <!-- Footer -->
      <div class="text-center pt-8 box-content">
        <div class="flex items-center justify-center gap-3 mb-3">
          <img
            src="/angular-icon.svg"
            alt="Angular"
            class="h-6 w-6"
            aria-hidden="true"
          />
        </div>
        <div class="text-sm font-mono text-foreground-40">
          2026 Modus Angular App v1.0.0 + Angular 20 + Tailwind CSS -
          Created by Julian Oczkowski
        </div>
      </div>
    </div>
  `,
})
export class ComponentsGalleryComponent {
  private readonly router = inject(Router);

  readonly categories = categories;
  readonly selectedCategory = signal<string>('all');

  readonly filteredComponents = computed(() => {
    const category = this.selectedCategory();
    if (category === 'all') {
      return componentDemos;
    }
    return componentDemos.filter((component) => component.category.toLowerCase() === category);
  });

  setCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  navigateTo(url: string): void {
    this.router.navigate([url]);
  }
}
