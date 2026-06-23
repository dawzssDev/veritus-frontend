import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { HeaderComponent } from '../components/header/header.component';

/**
 * Layout principal con sidebar y header
 * Este componente sirve como layout base para las páginas internas
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="main-layout">
      <!-- Sidebar -->
      <app-sidebar></app-sidebar>

      <!-- Header -->
      <app-header></app-header>

      <!-- Contenido principal -->
      <main class="main-content">
        <div class="content-wrapper">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    // ============================================================
    // LAYOUT PRINCIPAL - DISEÑO RESPONSIVO COMPLETO
    // ============================================================
    
    .main-layout {
      display: flex;
      min-height: 100vh;
      background-color: #f5f5f5;
      position: relative;
    }

    .main-content {
      flex: 1;
      margin-left: 220px; // Sidebar expandido en desktop
      margin-top: 56px; // Header height
      padding: 0;
      transition: margin-left 0.2s ease;
      min-height: calc(100vh - 56px);
      width: 100%;
    }

    .content-wrapper {
      padding: 28px 32px;
      max-width: 100%;
      margin: 0 auto;
      animation: fadeInContent 0.4s ease-out;
    }

    @keyframes fadeInContent {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    // ============================================================
    // ESTADO COLAPSADO (PC)
    // ============================================================
    
    :host-context(body.sidebar-collapsed) .main-content {
      margin-left: 64px; // Sidebar colapsado
    }

    // ============================================================
    // RESPONSIVE - TABLET (768px - 1024px)
    // ============================================================
    
    @media (max-width: 1024px) and (min-width: 769px) {
      .main-content {
        margin-left: 220px;
      }
      
      :host-context(body.sidebar-collapsed) .main-content {
        margin-left: 64px;
      }

      .content-wrapper {
        padding: 24px 28px;
      }
    }

    // ============================================================
    // RESPONSIVE - MÓVIL (< 768px)
    // ============================================================
    
    @media (max-width: 768px) {
      .main-content {
        margin-left: 0 !important;
        padding: 0;
      }

      .content-wrapper {
        padding: 0; // Eliminar padding en móvil
      }
    }

    // ============================================================
    // RESPONSIVE - MÓVIL PEQUEÑO (< 480px)
    // ============================================================
    
    @media (max-width: 480px) {
      .content-wrapper {
        padding: 0; // Sin padding en móvil
      }
    }

    // ============================================================
    // TRANSICIONES SUAVES
    // ============================================================
    
    @media (prefers-reduced-motion: reduce) {
      .main-content,
      .content-wrapper {
        transition: none !important;
        animation: none !important;
      }
    }
  `]
})
export class MainLayoutComponent {}
