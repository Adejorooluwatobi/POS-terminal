import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
  styles: []
})
export class App {
  // ThemeService injected here ensures data-theme is set on <html> before
  // any route component renders, preventing a flash of unstyled content.
  private _theme = inject(ThemeService);
}
