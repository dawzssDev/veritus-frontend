import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { DatosFiscales } from '../../models/facturacion.interface';
import { FacturacionService } from '../../services/facturacion/facturacion.service';

@Component({
  selector: 'app-datos-fiscales-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatSelectModule,
  ],
  templateUrl: './datos-fiscales-dialog.component.html',
  styleUrl: './datos-fiscales-dialog.component.scss',
})
export class DatosFiscalesDialogComponent {
  public dialogRef = inject(MatDialogRef<DatosFiscalesDialogComponent>);
  public data = inject<{ datosFiscales: DatosFiscales | null }>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private facturacionService = inject(FacturacionService);

  guardando = signal<boolean>(false);
  errorGuardado = signal<string | null>(null);

  form = this.fb.group({
    razon_social:   [this.data.datosFiscales?.razon_social   ?? '', Validators.required],
    rfc:            [this.data.datosFiscales?.rfc             ?? '', Validators.required],
    regimen_fiscal: [this.data.datosFiscales?.regimen_fiscal  ?? ''],
    uso_cfdi:       [this.data.datosFiscales?.uso_cfdi        ?? ''],
    calle:          [this.data.datosFiscales?.calle           ?? ''],
    colonia:        [this.data.datosFiscales?.colonia         ?? ''],
    municipio:      [this.data.datosFiscales?.municipio       ?? ''],
    estado:         [this.data.datosFiscales?.estado          ?? ''],
    cp:             [this.data.datosFiscales?.cp              ?? ''],
    email_fiscal:   [this.data.datosFiscales?.email_fiscal    ?? '', Validators.email],
  });

  guardar(): void {
    if (this.form.invalid || this.guardando()) return;
    this.guardando.set(true);
    this.errorGuardado.set(null);

    this.facturacionService.guardarDatosFiscales(
      this.form.value as DatosFiscales
    ).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.dialogRef.close(res.data);
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorGuardado.set(
          err?.error?.message ?? 'Error al guardar los datos fiscales'
        );
      }
    });
  }

  solicitarCambios(): void {
    const mensaje = encodeURIComponent('Hola, necesito actualizar mis datos fiscales.');
    window.open(`https://wa.me/526721095469?text=${mensaje}`, '_blank');
  }
}
