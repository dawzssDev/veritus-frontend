import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TurnoEstadoService } from '../../turno-caja/turno-estado.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth/auth.service';
import { SidebarService } from '../../services/sidebar/sidebar.service';
import { TrialService } from '../../services/trial/trial.service';
import { ThemeService } from '../../services/theme/theme.service';
import { ProfileDialogComponent } from '../profile-dialog/profile-dialog.component';

/**
 * Header Component (Topbar)
 * Barra superior con información del usuario y acciones
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  /** Usuario actual */
  userName: string = '';
  userAvatar?: string;
  
  /** Estado del sidebar para ajustar el header */
  get isSidebarCollapsed(): boolean {
    return this.sidebarService.isCollapsed();
  }

  // Servicios
  public authService = inject(AuthService);
  turnoEstado = inject(TurnoEstadoService);
  themeService = inject(ThemeService);
  private sidebarService = inject(SidebarService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  trialService = inject(TrialService);

  constructor() {}

  ngOnInit(): void {
    // Cargar datos del usuario
    this.userName = this.authService.getFirstName();
    this.userAvatar = this.authService.getUserAvatar();
    
    // Cargar estado del trial
    this.trialService.cargar();

    this.turnoEstado.refrescar();
    setInterval(() => this.turnoEstado.refrescar(), 60000);
  }

  irACaja(): void {
    this.router.navigate(['/turno-caja']);
  }

  /**
   * Toggle del sidebar desde el header
   */
  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  /**
   * Abre el sidebar en móvil
   */
  openMobileSidebar(): void {
    if (this.sidebarService.isOverlayMode()) {
      this.sidebarService.toggleSidebar();
    }
  }

  /**
   * Navega al perfil del usuario
   */
  goToProfile(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      const dialogRef = this.dialog.open(ProfileDialogComponent, {
        width: '600px',
        maxWidth: '95vw',
        data: { user: currentUser },
        panelClass: 'profile-dialog-container',
        autoFocus: false
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === 'edit') {
          // TODO: Implementar navegación a edición de perfil
          console.log('Editar perfil');
        } else if (result === 'changePassword') {
          // TODO: Implementar cambio de contraseña
          console.log('Cambiar contraseña');
        }
      });
    }
  }

  /**
   * Navega a configuración
   */
  goToSettings(): void {
    // Implementar navegación a configuración
    console.log('Navegar a configuración');
  }

  /**
   * Alterna entre tema claro y oscuro
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /**
   * Cierra sesión
   */
  logout(): void {
    this.authService.logout();
    // Redirigir a login
    console.log('Cerrar sesión');
  }

  /**
   * Abre notificaciones
   */
  openNotifications(): void {
    // Implementar panel de notificaciones
    console.log('Abrir notificaciones');
  }
}
