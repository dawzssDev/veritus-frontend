import { Component, signal, inject, OnInit } from '@angular/core';
import { NavigationStart, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';
import { AuthService } from './services/auth/auth.service';
import { TrialService } from './services/trial/trial.service';
import { ThemeService } from './services/theme/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('navogo-admin');
  
  // Control del sidebar en móvil
  sidebarAbierto = false;

  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog, { optional: true });
  trialService = inject(TrialService);
  /** Inicializa el tema al arrancar la app autenticada */
  private readonly themeService = inject(ThemeService);

  constructor(public authService: AuthService) {
    this.router.events
      .pipe(
        filter((e): e is NavigationStart => e instanceof NavigationStart)
      )
      .subscribe(() => {
        // Cerrar sidebar en móvil al navegar
        this.sidebarAbierto = false;
        
        // Limpieza global para evitar que una pantalla quede bloqueada por
        // backdrops/scroll-locks al navegar (incluye back/forward).
        if (typeof document !== 'undefined') {
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
        }

        // Si en algún flujo usamos MatDialog, aseguramos que no quede abierto.
        this.dialog?.closeAll();
      });
  }
  
  ngOnInit(): void {
    // Cargar estado del trial solo si el usuario está logueado
    if (this.authService.isAuthenticated()) {
      this.trialService.cargar();
    }
  }
  
  toggleSidebar(): void {
    this.sidebarAbierto = !this.sidebarAbierto;
  }
}
