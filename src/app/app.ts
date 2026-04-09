import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { DevPanelService } from './dev/dev-panel.service';
import { DevPanelComponent } from './dev/dev-panel/dev-panel.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DevPanelComponent],
  template: `
    <router-outlet />
    @if (devPanelService.isEnabled()) {
      <app-dev-panel />
    }
  `,
  host: {
    class: 'min-h-screen flex flex-col',
  },
})
export class App implements OnInit {
  private readonly themeService = inject(ThemeService);
  readonly devPanelService = inject(DevPanelService);

  ngOnInit(): void {
    this.themeService.getThemeConfig();
  }
}
