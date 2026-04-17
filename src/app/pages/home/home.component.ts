import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModusButtonComponent } from '../../components/modus-button.component';
import { ModusTypographyComponent } from '../../components/modus-typography.component';

/**
 * Home page component.
 *
 * This is the main landing page for the user's application.
 * Edit this component to create your own home page.
 *
 * Getting Started:
 * 1. Customize the hero section with your app's branding
 * 2. Add your own features and content
 * 3. Use Ctrl+Shift+D to open the Dev Panel for component reference
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ModusButtonComponent, ModusTypographyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex flex-col bg-background">
      <div class="flex-1 flex flex-col items-center p-8">
        <div class="max-w-4xl w-full space-y-8">
          <!-- Header -->
          <div class="text-center space-y-4">
            <modus-typography hierarchy="h1" size="3xl" weight="bold" className="text-foreground">Modus Angular App</modus-typography>
            <modus-typography hierarchy="p" size="xl" className="text-foreground-60">
              A production-ready Angular boilerplate with Modus Design System integration.
            </modus-typography>
          </div>

          <!-- Dev Panel Hint -->
          <div class="flex justify-center">
            <modus-button color="primary" size="lg" (buttonClick)="openDevPanel()">
              <div class="flex items-center gap-2">
                <i class="modus-icons">code</i>
                <div>Open Dev Panel</div>
              </div>
            </modus-button>
          </div>

          <!-- Getting Started -->
          <div class="bg-card border-default rounded-lg p-6 space-y-4">
            <modus-typography hierarchy="h2" size="lg" weight="semibold" className="text-foreground">Getting Started</modus-typography>
            <div class="space-y-4 text-foreground-80">
              <div class="flex gap-3">
                <div class="flex-shrink-0 w-6 h-6 rounded-full bg-muted-foreground text-background flex items-center justify-center">
                  <modus-typography size="sm" weight="bold">1</modus-typography>
                </div>
                <div>
                  <modus-typography hierarchy="h4" className="font-medium text-foreground">Build Your App</modus-typography>
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">
                    Start developing in
                    <code class="px-1 py-0.5 bg-muted rounded text-sm">src/app/pages/</code>
                    - add your routes in
                    <code class="px-1 py-0.5 bg-muted rounded text-sm">app.routes.ts</code>.
                  </modus-typography>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="flex-shrink-0 w-6 h-6 rounded-full bg-muted-foreground text-background flex items-center justify-center">
                  <modus-typography size="sm" weight="bold">2</modus-typography>
                </div>
                <div>
                  <modus-typography hierarchy="h4" className="font-medium text-foreground">Use the Dev Panel</modus-typography>
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">
                    Press
                    <modus-typography size="xs" className="inline px-1.5 py-0.5 bg-muted rounded font-mono">
                      Ctrl+Shift+D
                    </modus-typography>
                    to browse components, colors, and icons.
                  </modus-typography>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="flex-shrink-0 w-6 h-6 rounded-full bg-muted-foreground text-background flex items-center justify-center">
                  <modus-typography size="sm" weight="bold">3</modus-typography>
                </div>
                <div>
                  <modus-typography hierarchy="h4" className="font-medium text-foreground">Deploy</modus-typography>
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">
                    In production, the Dev Panel is automatically hidden. Your app ships clean.
                  </modus-typography>
                </div>
              </div>
            </div>
          </div>

          <!-- MCP Servers -->
          <div class="bg-card border-default rounded-lg p-6 space-y-4">
            <modus-typography hierarchy="h2" size="lg" weight="semibold" className="text-foreground">MCP Servers Included</modus-typography>
            <modus-typography hierarchy="p" size="sm" className="text-foreground-60 mb-4">
              Pre-configured Model Context Protocol servers for AI-assisted development.
            </modus-typography>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 bg-card rounded-lg border-thick-dashed">
                <modus-typography hierarchy="h4" className="font-medium text-foreground mb-1">Modus Docs MCP</modus-typography>
                <modus-typography hierarchy="p" size="sm" className="text-foreground-60">
                  Access Modus Web Components documentation directly in your AI assistant. Get
                  component props, usage examples, and best practices.
                </modus-typography>
              </div>
              <div class="p-4 bg-card rounded-lg border-thick-dashed">
                <modus-typography hierarchy="h4" className="font-medium text-foreground mb-1">Context7 MCP</modus-typography>
                <modus-typography hierarchy="p" size="sm" className="text-foreground-60">
                  Up-to-date library documentation for Angular, Tailwind, and other
                  dependencies.
                </modus-typography>
              </div>
            </div>
          </div>

          <!-- Cursor Rules -->
          <div class="bg-card border-default rounded-lg p-6 space-y-4">
            <modus-typography hierarchy="h2" size="lg" weight="semibold" className="text-foreground">AI-Powered Development Rules</modus-typography>
            <modus-typography hierarchy="p" size="sm" className="text-foreground-60 mb-4">
              Comprehensive Cursor rules ensure consistent, high-quality code generation.
            </modus-typography>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-3">
                <div class="flex items-start gap-2">
                  <i class="modus-icons text-muted-foreground mt-0.5">widgets</i>
                  <div>
                    <modus-typography hierarchy="h4" className="font-medium text-foreground">Component Patterns</modus-typography>
                    <modus-typography hierarchy="p" size="sm" className="text-foreground-60">
                      Angular integration, state management, event handling for Modus Web Components
                    </modus-typography>
                  </div>
                </div>
                <div class="flex items-start gap-2">
                  <i class="modus-icons text-muted-foreground mt-0.5">palette</i>
                  <div>
                    <modus-typography hierarchy="h4" className="font-medium text-foreground">Design System Compliance</modus-typography>
                    <modus-typography hierarchy="p" size="sm" className="text-foreground-60">
                      Color usage, border utilities, opacity patterns, icon guidelines
                    </modus-typography>
                  </div>
                </div>
                <div class="flex items-start gap-2">
                  <i class="modus-icons text-muted-foreground mt-0.5">accessibility</i>
                  <div>
                    <modus-typography hierarchy="h4" className="font-medium text-foreground">Accessibility Standards</modus-typography>
                    <modus-typography hierarchy="p" size="sm" className="text-foreground-60">
                      Semantic HTML patterns, ARIA attributes, keyboard navigation
                    </modus-typography>
                  </div>
                </div>
              </div>
              <div class="space-y-3">
                <div class="flex items-start gap-2">
                  <i class="modus-icons text-muted-foreground mt-0.5">dashboard</i>
                  <div>
                    <modus-typography hierarchy="h4" className="font-medium text-foreground">UX Foundations</modus-typography>
                    <modus-typography hierarchy="p" size="sm" className="text-foreground-60">
                      Gestalt laws, visual hierarchy, spacing rhythms, interaction patterns
                    </modus-typography>
                  </div>
                </div>
                <div class="flex items-start gap-2">
                  <i class="modus-icons text-muted-foreground mt-0.5">wrench</i>
                  <div>
                    <modus-typography hierarchy="h4" className="font-medium text-foreground">Development Workflow</modus-typography>
                    <modus-typography hierarchy="p" size="sm" className="text-foreground-60">
                      Linting commands, quality gates, testing procedures
                    </modus-typography>
                  </div>
                </div>
                <div class="flex items-start gap-2">
                  <i class="modus-icons text-muted-foreground mt-0.5">bug</i>
                  <div>
                    <modus-typography hierarchy="h4" className="font-medium text-foreground">Known Issues</modus-typography>
                    <modus-typography hierarchy="p" size="sm" className="text-foreground-60">
                      Checkbox value inversion, modal patterns, select vs dropdown
                    </modus-typography>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quality Automation -->
          <div class="bg-card border-default rounded-lg p-6 space-y-4">
            <modus-typography hierarchy="h2" size="lg" weight="semibold" className="text-foreground">Quality Automation</modus-typography>
            <modus-typography hierarchy="p" size="sm" className="text-foreground-60 mb-4">
              Pre-configured Husky hooks and GitHub workflows for automated quality assurance.
            </modus-typography>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 bg-card rounded-lg border-thick-dashed">
                <modus-typography hierarchy="h4" className="font-medium text-foreground mb-2">Pre-commit Hooks</modus-typography>
                <div class="space-y-1">
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">TypeScript type checking</modus-typography>
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">Design system color validation</modus-typography>
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">Modus icon usage verification</modus-typography>
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">Border and opacity pattern checks</modus-typography>
                </div>
              </div>
              <div class="p-4 bg-card rounded-lg border-thick-dashed">
                <modus-typography hierarchy="h4" className="font-medium text-foreground mb-2">Linting Scripts</modus-typography>
                <div class="space-y-1">
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">Inline style detection</modus-typography>
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">Semantic HTML enforcement</modus-typography>
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">Icon name validation (700+ icons)</modus-typography>
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">
                    Run all checks with
                    <code class="px-1 py-0.5 bg-muted rounded text-xs font-mono">npm run lint:all</code>
                  </modus-typography>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="text-center pt-8 box-content">
            <div class="flex items-center justify-center gap-3 mb-3">
              <img src="/angular-icon.svg" alt="Angular" class="h-6 w-6" aria-hidden="true" />
            </div>
            <modus-typography hierarchy="p" size="sm" className="font-mono text-foreground-40">
              2026 Modus Angular App v1.0.0 + Angular 20 + Tailwind CSS - Created by Julian
              Oczkowski
            </modus-typography>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class HomeComponent {
  /**
   * Opens the Dev Panel by dispatching a keyboard event for Ctrl+Shift+D.
   */
  openDevPanel(): void {
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        ctrlKey: true,
        shiftKey: true,
        key: 'd',
      }),
    );
  }
}
