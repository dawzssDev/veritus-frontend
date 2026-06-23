import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { LoginCredentials } from '../../models/auth.interface';

/**
 * LoginComponent
 * Componente de inicio de sesión con formulario reactivo
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  hidePassword = true;

  // UI state
  emailFocused  = false;
  passFocused   = false;
  mostrarPass   = false;
  readonly anio = new Date().getFullYear();

  readonly features = [
    { texto: 'Punto de venta y gestión de mesas' },
    { texto: 'Pedidos, reservas y domicilios' },
    { texto: 'Reportes y corte de caja' },
    { texto: 'Pantalla TV para tu menú digital' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Inicializar formulario
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Si ya está autenticado, redirigir al dashboard inmediatamente
    if (this.authService.isAuthenticated()) {
      // Usar replaceUrl para evitar que el usuario pueda volver al login con el botón atrás
      this.router.navigate(['/ventas'], { replaceUrl: true });
    }
  }

  /**
   * Envío del formulario de login
   */
  onSubmit(): void {
    // Validar formulario
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials: LoginCredentials = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('allowAdminLogin');
        }

        // Redirigir a returnUrl (si venía de un guard) o a Ventas por defecto.
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        
        // Usar setTimeout para asegurar que la navegación ocurra después de que se complete el ciclo de detección de cambios
        setTimeout(() => {
          if (returnUrl) {
            this.router.navigateByUrl(returnUrl, { replaceUrl: true });
          } else {
            // Usar replaceUrl para evitar que el usuario pueda volver al login con el botón atrás
            this.router.navigate(['/ventas'], { replaceUrl: true }).then(() => {
              console.log('Login exitoso - navegando a /ventas');
            });
          }
        }, 100);
      },
      error: (error: Error) => {
        this.isLoading = false;
        this.errorMessage = error.message;
      }
    });
  }

  /**
   * Toggle de visibilidad de password
   */
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  /**
   * Marca todos los campos del formulario como touched
   * para mostrar errores de validación
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Obtiene el mensaje de error para el campo email
   */
  getEmailErrorMessage(): string {
    const emailControl = this.loginForm.get('email');
    if (emailControl?.hasError('required')) {
      return 'El email es requerido';
    }
    if (emailControl?.hasError('email')) {
      return 'Ingresa un email válido';
    }
    return '';
  }

  /**
   * Obtiene el mensaje de error para el campo password
   */
  getPasswordErrorMessage(): string {
    const passwordControl = this.loginForm.get('password');
    if (passwordControl?.hasError('required')) {
      return 'La contraseña es requerida';
    }
    if (passwordControl?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  }
}
