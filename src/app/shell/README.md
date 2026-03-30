# Dashboard Shell - Starter Template

A configurable Angular 20 dashboard shell built on the Modus 2.0 Design System with drag/resize widgets, canvas mode, AI panel, side navigation, and 6-theme support.

## Quick Start

```bash
# 1. Fork/clone this repository
git clone <your-repo-url>
cd project-dashboard-starter

# 2. Install dependencies
npm install

# 3. Start development server
npm start
# Open http://localhost:4200
```

## Architecture

```
src/app/
  shell/                         # The reusable dashboard shell
    services/
      dashboard-layout-engine.ts # Drag/resize/canvas layout logic (~820 lines)
      widget-layout.service.ts   # sessionStorage persistence for widget positions
      canvas-reset.service.ts    # Cross-component reset coordination
      theme.service.ts           # 6-theme switching with localStorage
      widget-focus.service.ts    # Widget-to-AI-panel focus bridge
    components/
      widget-resize-handle.component.ts  # Resize handle dots
      ai-icon.component.ts               # Trimble AI gradient SVG icon
    layout/
      dashboard-shell.component.ts       # Configurable shell with navbar + sidenav + AI panel
  components/                    # Modus Web Component wrappers (48 components)
  pages/                         # Your application pages
  data/                          # Data layer
```

## How It Works

### DashboardShellComponent

The shell provides the complete application chrome: navbar, side navigation, AI assistant panel, theme switching, and canvas mode. Your pages are rendered inside via `<router-outlet>`.

```typescript
import { DashboardShellComponent, ShellNavItem, AiResponseFn } from './shell';

@Component({
  selector: 'app-my-layout',
  imports: [DashboardShellComponent],
  template: `
    <app-dashboard-shell
      [appTitle]="'My Dashboard'"
      [userCard]="userCard"
      [sideNavItems]="navItems"
      [homeRoute]="'/'"
      [aiResponseFn]="handleAiQuery"
      [defaultAiSuggestions]="suggestions"
      [aiWelcomeText]="'Ask me about your data.'"
    />
  `,
})
export class MyLayoutComponent {
  userCard = { name: 'Jane Doe', email: 'jane@example.com' };

  navItems: ShellNavItem[] = [
    { value: 'home', label: 'Home', icon: 'home', route: '/' },
    { value: 'projects', label: 'Projects', icon: 'briefcase', route: '/projects' },
    { value: 'reports', label: 'Reports', icon: 'bar_graph', route: '/reports' },
  ];

  suggestions = ['Show overview', 'What needs attention?'];

  handleAiQuery: AiResponseFn = (input) => {
    // Your AI logic here -- can return string or Promise<string>
    return `You asked: "${input}". Implement your AI response logic here.`;
  };
}
```

### Shell Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `appTitle` | `string` | `'Dashboard'` | Title shown in the navbar |
| `userCard` | `INavbarUserCard` | Default user | User profile for the navbar |
| `sideNavItems` | `ShellNavItem[]` | Home only | Side navigation items with routes |
| `homeRoute` | `string` | `'/'` | Route for the Trimble logo click |
| `aiResponseFn` | `AiResponseFn` | Default handler | Custom AI response function |
| `defaultAiSuggestions` | `string[]` | Generic suggestions | AI suggestion chips |
| `aiWelcomeText` | `string` | Generic welcome | AI panel welcome message |
| `aiPlaceholder` | `string` | `'Ask a question...'` | AI input placeholder |

### DashboardLayoutEngine

Each page creates its own `DashboardLayoutEngine` instance to manage widget layout, drag/drop, and resize:

```typescript
import { DashboardLayoutEngine } from './shell/services/dashboard-layout-engine';
import { WidgetLayoutService } from './shell/services/widget-layout.service';

export class MyDashboardPage {
  private engine = new DashboardLayoutEngine({
    widgets: ['widget1', 'widget2', 'widget3'],
    layoutStorageKey: 'my-dashboard',
    canvasStorageKey: 'canvas-layout:my-dashboard:v1',
    // Default positions for desktop
    defaultColStarts: { widget1: 1, widget2: 9, widget3: 1 },
    defaultColSpans:  { widget1: 8, widget2: 8, widget3: 16 },
    defaultTops:      { widget1: 0, widget2: 0, widget3: 420 },
    defaultHeights:   { widget1: 400, widget2: 400, widget3: 300 },
    // ... more config
    onWidgetSelect: (id) => this.widgetFocusService.selectWidget(id),
  }, inject(WidgetLayoutService));
}
```

The engine provides reactive signals for all widget positions:

- `widgetTops()`, `widgetHeights()`, `widgetLefts()`, `widgetPixelWidths()`
- `widgetZIndices()`, `moveTargetId()`, `canvasGridMinHeight()`
- `isMobile()`, `isCanvasMode()`

### WidgetFocusService

Register widgets to connect them with the AI panel:

```typescript
import { WidgetFocusService, WidgetRegistration } from './shell/services/widget-focus.service';

// In app.ts or a page component
const widgetFocusService = inject(WidgetFocusService);

widgetFocusService.setDefaults('My AI', 'Dashboard Assistant');

widgetFocusService.registerWidgets({
  myWidget: {
    name: 'My Widget',
    suggestions: ['What data does this show?', 'Summarize trends'],
  },
});

// When a widget is focused (e.g., from a header button click)
widgetFocusService.selectWidget('myWidget');
```

## Adding a New Dashboard Page

1. **Create a component** in `src/app/pages/my-page/`
2. **Define widgets** as an array of string IDs
3. **Create a DashboardLayoutEngine** with default positions
4. **Build the template** with absolute-positioned widget containers
5. **Register widgets** with `WidgetFocusService` for AI integration
6. **Add the route** in `app.routes.ts`

See `src/app/pages/home-page/` for a complete working example.

## Customization Points

### Navbar

The shell's navbar is controlled by `sideNavItems`, `userCard`, and `appTitle` inputs. For deeper customization, modify `DashboardShellComponent` template slots.

### Side Navigation

Pass custom `ShellNavItem[]` with icons, labels, and routes. The settings icon is built in. Extend by modifying the side nav section in the shell template.

### AI Panel

Provide a custom `aiResponseFn` that returns a string or `Promise<string>`. For real AI integration, make it async:

```typescript
handleAiQuery: AiResponseFn = async (input) => {
  const response = await fetch('/api/ai', {
    method: 'POST',
    body: JSON.stringify({ query: input }),
  });
  const data = await response.json();
  return data.answer;
};
```

### Theme Switching

The shell includes light/dark toggle in the navbar. All 6 Modus themes are supported. Use `ThemeService` for programmatic access:

```typescript
const themeService = inject(ThemeService);
themeService.setTheme('modus-modern-dark');
```

### Canvas Mode

Canvas mode activates automatically at 2000px viewport width. Widgets become free-form draggable. Hold Space + drag to pan the canvas. The reset menu in the side nav offers "Reset View", "Clean Up Overlaps", and "Reset Widgets".

## Three Modes

| Mode | Viewport | Behavior |
|------|----------|----------|
| **Mobile** | < 768px | Stacked, vertical-only layout |
| **Desktop** | 768-1999px | Grid-based, drag/resize widgets |
| **Canvas** | >= 2000px | Free-form canvas with pan/scroll |

## Design System

Uses the Modus 9-color design system exclusively:

- `bg-background`, `bg-card`, `bg-muted`, `bg-secondary`, `bg-primary`
- `bg-success`, `bg-warning`, `bg-destructive`
- `text-foreground` and corresponding foreground variants
- Custom opacity utilities: `text-foreground-80`, `bg-primary-20`
- Custom border utilities: `border-default`, `border-primary`

Never use generic Tailwind colors (`bg-blue-500`) or hardcoded hex values.

## Dependencies

- Angular 20
- `@trimble-oss/moduswebcomponents` + `@trimble-oss/moduswebcomponents-angular`
- `@trimble-oss/modus-icons`
- Tailwind CSS v4

## Main Pages

- `/` -- Home dashboard with draggable widgets
- `/projects` -- Projects list with grid/list views
- `/financials` -- Financial overview with charts and tables
- `/projects/:slug` -- Project detail with 8 sub-pages
