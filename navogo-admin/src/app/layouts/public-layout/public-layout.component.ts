import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * LAYOUT PÚBLICO - Sin sidebar, sin header
 * Para vistas públicas como el menú digital
 */
@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="public-layout">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .public-layout {
      width: 100%;
      min-height: 100vh;
      background-color: #f8f9fa;
    }
  `]
})
export class PublicLayoutComponent {}
