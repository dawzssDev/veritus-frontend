import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// Material
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Servicios y modelos
import { Empresas } from '../../services/empresas/empresas';
import { AuthService } from '../../services/auth/auth.service';
import { ShippingConfig } from '../../models/business.interface';

@Component({
  selector: 'app-empresa-envio-config',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './empresa-envio-config.html',
  styleUrl: './empresa-envio-config.scss',
})
export class EmpresaEnvioConfig implements OnInit {
  form: FormGroup;
  isLoading = false;
  isSaving = false;
  empresaId: number = 0;
  errorMessage: string | null = null;

  // Ejemplo dinámico de cálculo
  exampleDistance = 5;
  calculatedCost = 0;

  constructor(
    private fb: FormBuilder,
    private empresaService: Empresas,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.form = this.fb.group({
      status_envio: [false],
      costo_base: [
        { value: 0, disabled: true },
        [Validators.required, Validators.min(0)],
      ],
      costo_por_km: [
        { value: 0, disabled: true },
        [Validators.required, Validators.min(0)],
      ],
      radio_max_km: [{ value: null, disabled: true }, [Validators.min(0)]],
      envio_gratis_km: [{ value: null, disabled: true }, [Validators.min(0)]],
      envio_gratis_monto: [{ value: null, disabled: true }, [Validators.min(0)]],
    });

    // Escuchar cambios en el toggle de envío
    this.form.get('status_envio')?.valueChanges.subscribe((enabled) => {
      this.toggleEnvioFields(enabled);
    });

    // Escuchar cambios para actualizar el ejemplo dinámico
    this.form.valueChanges.subscribe(() => {
      this.updateExample();
    });
  }

  ngOnInit(): void {
    this.loadEmpresaId();
    this.loadShippingConfig();
  }

  private loadEmpresaId(): void {
    const empresaId = this.authService.getEmpresaId();
    if (!empresaId) {
      this.errorMessage = 'No se encontró la empresa asociada a tu usuario.';
      this.showSnackBar('Error: No se encontró la empresa.', 'error');
      return;
    }
    this.empresaId = empresaId;
  }

  loadShippingConfig(): void {
    if (this.empresaId <= 0) return;

    this.isLoading = true;
    this.errorMessage = null;

    this.empresaService.getById(this.empresaId).subscribe({
      next: (res: any) => {
        const empresa = Array.isArray(res) ? res[0] : res;
        
        if (empresa) {
          const statusEnvio = Number(empresa.status_envio) === 1;
          
          this.form.patchValue({
            status_envio: statusEnvio,
            costo_base: empresa.costo_base || 0,
            costo_por_km: empresa.costo_por_km || 0,
            radio_max_km: empresa.radio_max_km || null,
            envio_gratis_km: empresa.envio_gratis_km || null,
            envio_gratis_monto: empresa.envio_gratis_monto || null,
          });

          this.toggleEnvioFields(statusEnvio);
          this.updateExample();
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar configuración de envío:', err);
        this.errorMessage = 'No se pudo cargar la configuración de envío.';
        this.showSnackBar('Error al cargar la configuración.', 'error');
        this.isLoading = false;
      },
    });
  }

  private toggleEnvioFields(enabled: boolean): void {
    const fields = [
      'costo_base',
      'costo_por_km',
      'radio_max_km',
      'envio_gratis_km',
      'envio_gratis_monto',
    ];

    fields.forEach((field) => {
      const control = this.form.get(field);
      if (enabled) {
        control?.enable({ emitEvent: false });
      } else {
        control?.disable({ emitEvent: false });
      }
    });
  }

  private updateExample(): void {
    if (!this.form.get('status_envio')?.value) {
      this.calculatedCost = 0;
      return;
    }

    const costoBase = Number(this.form.get('costo_base')?.value) || 0;
    const costoPorKm = Number(this.form.get('costo_por_km')?.value) || 0;
    const envioGratisKm = Number(this.form.get('envio_gratis_km')?.value) || null;

    // Si está dentro del radio de envío gratis
    if (envioGratisKm && this.exampleDistance <= envioGratisKm) {
      this.calculatedCost = 0;
      return;
    }

    // Calcular costo normal
    this.calculatedCost = costoBase + costoPorKm * this.exampleDistance;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.showSnackBar('Por favor, completa todos los campos requeridos.', 'error');
      return;
    }

    this.isSaving = true;

    const formValue = this.form.getRawValue(); // getRawValue incluye campos deshabilitados
    const data = {
      id: this.empresaId,
      status_envio: formValue.status_envio ? 1 : 0,
      costo_base: Number(formValue.costo_base) || 0,
      costo_por_km: Number(formValue.costo_por_km) || 0,
      radio_max_km: formValue.radio_max_km ? Number(formValue.radio_max_km) : null,
      envio_gratis_km: formValue.envio_gratis_km
        ? Number(formValue.envio_gratis_km)
        : null,
      envio_gratis_monto: formValue.envio_gratis_monto
        ? Number(formValue.envio_gratis_monto)
        : null,
    };

    this.empresaService.update(this.empresaId, data).subscribe({
      next: (response) => {
        this.showSnackBar('✓ Configuración de envío guardada correctamente', 'success');
        this.isSaving = false;
      },
      error: (err) => {
        console.error('Error al guardar configuración:', err);
        this.showSnackBar('✗ Error al guardar la configuración', 'error');
        this.isSaving = false;
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/empresas']);
  }

  private showSnackBar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: type === 'success' ? 3000 : 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error',
    });
  }

  get isEnvioEnabled(): boolean {
    return this.form.get('status_envio')?.value === true;
  }

  get hasValidExample(): boolean {
    return this.isEnvioEnabled && this.calculatedCost >= 0;
  }
}
