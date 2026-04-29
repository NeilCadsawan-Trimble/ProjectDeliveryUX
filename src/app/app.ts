import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { AiFloatingPromptHostComponent } from './shell/components/ai-floating-prompt-host.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AiFloatingPromptHostComponent],
  template: `
    <router-outlet />
    @defer (on idle) {
      <ai-floating-prompt-host />
    }
  `,
  host: {
    class: 'min-h-screen flex flex-col',
  },
})
export class App implements OnInit {
  private readonly themeService = inject(ThemeService);

  ngOnInit(): void {
    this.themeService.getThemeConfig();
  }
}
