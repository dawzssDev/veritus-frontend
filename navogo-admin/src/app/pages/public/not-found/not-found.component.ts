import { Component } from '@angular/core';
import { Router } from '@angular/router';

/**
 * PÁGINA 404 - Negocio no encontrado
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <div class="icon">🍽️</div>
        <h1>404</h1>
        <h2>Página no encontrada</h2>
        <p>La página que buscas no existe o fue movida.</p>
        <button class="btn-home" (click)="goHome()">
          Volver al inicio
        </button>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 24px;
    }

    .not-found-content {
      text-align: center;
      color: white;
    }

    .icon {
      font-size: 80px;
      margin-bottom: 24px;
    }

    h1 {
      font-size: 72px;
      font-weight: 700;
      margin: 0 0 16px 0;
    }

    h2 {
      font-size: 32px;
      font-weight: 600;
      margin: 0 0 16px 0;
    }

    p {
      font-size: 18px;
      opacity: 0.9;
      margin-bottom: 32px;
    }

    .btn-home {
      padding: 16px 32px;
      background: white;
      color: #667eea;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
      }
    }
  `]
})
export class NotFoundComponent {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/']);
  }
}
