import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface DatosRecogeDialogData {
  nombre?: string;
  telefono?: string;
}

export interface DatosRecogeDialogResult {
  nombre: string;
  telefono: string;
}

@Component({
  selector: 'app-datos-recoge-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './datos-recoge-dialog.component.html',
  styleUrl: './datos-recoge-dialog.component.scss',
})
export class DatosRecogeDialogComponent {
  nombre: string;
  telefono: string;

  constructor(
    private dialogRef: MatDialogRef<DatosRecogeDialogComponent, DatosRecogeDialogResult | undefined>,
    @Inject(MAT_DIALOG_DATA) data: DatosRecogeDialogData | null
  ) {
    this.nombre = data?.nombre ?? '';
    this.telefono = data?.telefono ?? '';
  }

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    const nombre = this.nombre.trim();
    const telefono = this.telefono.trim();
    if (!nombre || !telefono) return;
    this.dialogRef.close({ nombre, telefono });
  }

  get esValido(): boolean {
    return this.nombre.trim().length > 0 && this.telefono.trim().length > 0;
  }
}
