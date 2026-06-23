import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatOptionModule } from '@angular/material/core';

import Swal from 'sweetalert2';
import { Usuarios } from '../../../services/usuarios/usuarios';
import { AuthService } from '../../../services/auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-usuarios-nuevo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatOptionModule,
    MatSlideToggleModule,
  ],
  templateUrl: './usuarios-nuevo.html',
  styleUrl: './usuarios-nuevo.css',
})
export class UsuariosNuevo {
  form: FormGroup;

  selectedFile: File | null = null;
  currentPhotoUrl: string = '';
  photoPreviewUrl: string | null = null;

  private userId: number = 0;
  isEdit = false;
  changePassword = false; // Toggle para cambiar contraseña

  title = 'Crear usuario';
  nameButton = 'Guardar';

  constructor(
    private fb: FormBuilder,
    private usuariosService: Usuarios,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.form = this.fb.group({  
      nombreCompleto: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      roleId: [1],
      activo: [true],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
    });

    // Validar que las contraseñas coincidan en tiempo real
    this.form.get('password')?.valueChanges.subscribe(() => {
      this.form.get('confirmPassword')?.updateValueAndValidity({ emitEvent: false });
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const parsedId = idParam != null ? Number(idParam) : 0;

    if (Number.isFinite(parsedId) && parsedId > 0) {
      this.userId = parsedId;
      this.isEdit = true;
      this.title = 'Editar usuario';
      this.nameButton = 'Guardar cambios';

      // En edición, password es opcional (solo si changePassword es true)
      const passwordCtrl = this.form.get('password');
      const confirmPasswordCtrl = this.form.get('confirmPassword');
      passwordCtrl?.clearValidators();
      confirmPasswordCtrl?.clearValidators();
      passwordCtrl?.updateValueAndValidity({ emitEvent: false });
      confirmPasswordCtrl?.updateValueAndValidity({ emitEvent: false });

      this.load();
    }
  }

  toggleChangePassword(): void {
    this.changePassword = !this.changePassword;
    const passwordCtrl = this.form.get('password');
    const confirmPasswordCtrl = this.form.get('confirmPassword');

    if (this.changePassword) {
      passwordCtrl?.setValidators([Validators.required, Validators.minLength(6)]);
      confirmPasswordCtrl?.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      passwordCtrl?.clearValidators();
      confirmPasswordCtrl?.clearValidators();
      passwordCtrl?.setValue('');
      confirmPasswordCtrl?.setValue('');
    }

    passwordCtrl?.updateValueAndValidity();
    confirmPasswordCtrl?.updateValueAndValidity();
  }

  /**
   * Validador para verificar que las contraseñas coincidan
   */
  passwordsMatch(): boolean {
    const password = this.form.get('password')?.value;
    const confirmPassword = this.form.get('confirmPassword')?.value;
    return password === confirmPassword;
  }

  /**
   * Verifica si el campo confirmPassword tiene error de coincidencia
   * Se muestra en tiempo real mientras escribe
   */
  hasPasswordMismatch(): boolean {
    const passwordCtrl = this.form.get('password');
    const confirmPasswordCtrl = this.form.get('confirmPassword');
    const password = passwordCtrl?.value;
    const confirmPassword = confirmPasswordCtrl?.value;
    
    // Solo mostrar error si ambos campos tienen contenido y no coinciden
    return !!(password && confirmPassword && password !== confirmPassword);
  }

  private load(): void {
    this.usuariosService.getById(this.userId).subscribe({
      next: (res: any) => {
        this.currentPhotoUrl = this.buildUserPhotoUrl(res);
        this.photoPreviewUrl = null;
        this.selectedFile = null;

        this.form.patchValue({
          nombreCompleto: res?.nombreCompleto ?? '',
          email: res?.email ?? '',
          telefono: res?.telefono ?? '',
          roleId: res?.roleId ?? 1,
          activo: res?.activo ?? true,
        });
      },
      error: (err) => {
        console.error('Error al obtener usuario:', err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar el usuario.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
        }).then(() => this.router.navigate(['/usuarios']));
      },
    });
  }

  getDisplayPhotoUrl(): string {
    return (this.photoPreviewUrl ?? this.currentPhotoUrl ?? '').toString();
  }

  private buildUserPhotoUrl(res: any): string {
    const url = (res?.fotoPerfil_url ?? '').toString().trim();
    if (url) return url;

    const raw = (res?.fotoPerfil ?? '').toString().trim();
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return `${environment.storageUrl}/${raw}`;
  }

  onFileSelected(event: any): void {
    const file = event?.target?.files?.[0];
    if (!file) return;

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreviewUrl = typeof reader.result === 'string' ? reader.result : null;
    };
    reader.readAsDataURL(file);
  }

  cancel(): void {
    this.router.navigate(['/usuarios']);
  }

  submitType(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      Swal.fire({
        title: 'Formulario incompleto',
        text: 'Por favor completa todos los campos requeridos',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    // Validar que las contraseñas coincidan (en creación o edición con cambio)
    if (!this.isEdit || (this.isEdit && this.changePassword)) {
      if (!this.passwordsMatch()) {
        this.form.get('confirmPassword')?.markAsTouched();
        Swal.fire({
          title: 'Error',
          text: 'Las contraseñas no coinciden',
          icon: 'error',
          confirmButtonText: 'Aceptar',
        });
        return;
      }
    }

    const password = this.form.value.password;
    const formData = new FormData();

    formData.append('nombreCompleto', (this.form.value.nombreCompleto ?? '').toString());
    formData.append('email', (this.form.value.email ?? '').toString());

    // En creación o en edición con cambio de contraseña
    if (!this.isEdit) {
      formData.append('password', (this.form.value.password ?? '').toString());
    } else if (this.isEdit && this.changePassword && password) {
      formData.append('password', password.toString());
    }

    const telefono = (this.form.value.telefono ?? '').toString().trim();
    if (telefono) formData.append('telefono', telefono);

    const roleIdRaw = (this.form.value.roleId ?? '').toString().trim();
    // Roles: 1=Administrador, 2=Caja, 3=Mesero, 4=Cocina
    const roleIdNum = Number(roleIdRaw);
    if (roleIdRaw && Number.isFinite(roleIdNum)) {
      formData.append('roleId', String(roleIdNum));
    }

    const activo = !!this.form.value.activo;
    formData.append('activo', activo ? '1' : '0');

    // Asignar la empresa del usuario logueado al crear un nuevo usuario
    if (!this.isEdit) {
      const currentUser = this.authService.currentUser();
      const empresaId = currentUser?.id_empresa 
        ?? currentUser?.empresa_id 
        ?? currentUser?.empresaId 
        ?? currentUser?.empresa?.id;
      
      if (empresaId) {
        formData.append('id_empresa', String(empresaId));
      }
    }

    if (this.selectedFile) {
      formData.append('fotoPerfil', this.selectedFile);
    }

    const request$ = this.isEdit ? this.usuariosService.update(this.userId, formData) : this.usuariosService.post(formData);

    request$.subscribe({
      next: () => {
        const successMessage = this.isEdit 
          ? (this.changePassword ? '¡Usuario y contraseña actualizados correctamente!' : '¡Usuario actualizado correctamente!') 
          : '¡Usuario creado correctamente!';
        
        Swal.fire({
          title: 'Éxito',
          text: successMessage,
          icon: 'success',
          confirmButtonText: 'Aceptar',
        }).then(() => {
          this.router.navigate(['/usuarios']);
        });
      },
      error: (err) => {
        const message = (err?.error?.message || err?.error?.error || 'No se pudo guardar el usuario.').toString();
        Swal.fire({
          title: 'Error',
          text: message,
          icon: 'error',
          confirmButtonText: 'Aceptar',
        });
      },
    });
  }
}
