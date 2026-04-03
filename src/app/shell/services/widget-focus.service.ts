import { Injectable, signal, computed } from '@angular/core';

export interface WidgetNameEntry {
  id: string;
  name: string;
  icon?: string;
}

export interface WidgetRegistration {
  name: string;
  suggestions: string[];
}

@Injectable({
  providedIn: 'root',
})
export class WidgetFocusService {
  private readonly _selectedWidgetId = signal<string | null>(null);
  readonly selectedWidgetId = this._selectedWidgetId.asReadonly();

  private readonly _widgetNames = signal<Record<string, string>>({});
  private readonly _widgetSuggestions = signal<Record<string, string[]>>({});

  private readonly _defaultTitle = signal('AI Assistant');
  private readonly _defaultSubtitle = signal('Dashboard Assistant');

  readonly selectedWidgetName = computed(() => {
    const id = this._selectedWidgetId();
    if (!id) return null;
    return this._widgetNames()[id] ?? null;
  });

  readonly aiAssistantTitle = computed(() => {
    const name = this.selectedWidgetName();
    return name ?? this._defaultTitle();
  });

  readonly aiAssistantSubtitle = computed(() => {
    const name = this.selectedWidgetName();
    return name ? `Focused on ${name}` : this._defaultSubtitle();
  });

  readonly aiSuggestions = computed(() => {
    const id = this._selectedWidgetId();
    if (!id) return null;
    return this._widgetSuggestions()[id] ?? null;
  });

  setDefaults(title: string, subtitle: string): void {
    this._defaultTitle.set(title);
    this._defaultSubtitle.set(subtitle);
  }

  registerWidgets(widgets: Record<string, WidgetRegistration>): void {
    const names: Record<string, string> = {};
    const suggestions: Record<string, string[]> = {};
    for (const [id, entry] of Object.entries(widgets)) {
      names[id] = entry.name;
      suggestions[id] = entry.suggestions;
    }
    this._widgetNames.set(names);
    this._widgetSuggestions.set(suggestions);
  }

  registerWidget(id: string, name: string, suggestions: string[]): void {
    this._widgetNames.update((n) => ({ ...n, [id]: name }));
    this._widgetSuggestions.update((s) => ({ ...s, [id]: suggestions }));
  }

  selectWidget(id: string): void {
    this._selectedWidgetId.set(id);
  }

  clearSelection(): void {
    this._selectedWidgetId.set(null);
  }
}
