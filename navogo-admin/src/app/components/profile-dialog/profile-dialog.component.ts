import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { User } from '../../models/auth.interface';

/**
 * Profile Dialog Component
 * Diálogo profesional para mostrar información detallada del usuario
 */
@Component({
  selector: 'app-profile-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './profile-dialog.component.html',
  styleUrl: './profile-dialog.component.scss'
})
export class ProfileDialogComponent implements OnInit {
  user: User;
  userInitials: string = '';
  memberSince: string = '';

  constructor(
    public dialogRef: MatDialogRef<ProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: User }
  ) {
    this.user = data.user;
  }

  ngOnInit(): void {
    this.userInitials = this.getInitials(this.user.nombreCompleto);
    this.memberSince = this.formatMemberSince(this.user.created_at);
  }

  /**
   * Obtiene las iniciales del nombre completo
   */
  getInitials(name: string): string {
    if (!name) return 'U';
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Formatea la fecha de creación del usuario
   */
  formatMemberSince(date?: string): string {
    if (!date) return 'Fecha desconocida';
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' };
    return d.toLocaleDateString('es-ES', options);
  }

  /**
   * Obtiene el rol formateado del usuario
   */
  getRoleDisplay(): string {
    // Prioridad: roleId o role_id
    const roleId = this.user.roleId || this.user.role_id;
    
    if (roleId) {
      // Mapeo por ID
      const roleMapById: { [key: number]: string } = {
        1: 'Administrador',
        2: 'Caja',
        3: 'Mesero',
        4: 'Cocina'
      };
      return roleMapById[roleId] || `Rol ${roleId}`;
    }
    
    // Fallback: usar el campo role como string
    const role = this.user.role?.toLowerCase() || 'usuario';
    const roleMap: { [key: string]: string } = {
      'admin': 'Administrador',
      'administrator': 'Administrador',
      'empleado': 'Empleado',
      'manager': 'Gerente',
      'user': 'Usuario',
      'usuario': 'Usuario',
      'vendedor': 'Vendedor',
      'repartidor': 'Repartidor'
    };
    return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
  }

  /**
   * Obtiene el color del chip según el rol
   */
  getRoleColor(): string {
    // Prioridad: roleId o role_id
    const roleId = this.user.roleId || this.user.role_id;
    
    if (roleId) {
      // Color por ID: Administrador = primary, Empleado = default
      return roleId === 1 ? 'primary' : '';
    }
    
    // Fallback: usar el campo role como string
    const role = this.user.role?.toLowerCase() || 'usuario';
    if (role === 'admin' || role === 'administrator') return 'primary';
    if (role === 'manager' || role === 'gerente') return 'primary';
    return '';
  }

  /**
   * Cierra el diálogo
   */
  close(): void {
    this.dialogRef.close();
  }

  /**
   * Editar perfil (para implementar)
   */
  editProfile(): void {
    this.dialogRef.close('edit');
  }

  /**
   * Cambiar contraseña (para implementar)
   */
  changePassword(): void {
    this.dialogRef.close('changePassword');
  }

  /**
   * Verifica si el email está verificado
   */
  isEmailVerified(): boolean {
    return !!this.user.email_verified_at;
  }
}
