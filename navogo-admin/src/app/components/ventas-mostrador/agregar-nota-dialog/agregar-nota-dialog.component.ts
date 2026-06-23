import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface AgregarNotaDialogData {
  nota: string;
  nombreProducto: string;
}

@Component({
  selector: 'app-agregar-nota-dialog',
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
  templateUrl: './agregar-nota-dialog.component.html',
  styleUrl: './agregar-nota-dialog.component.scss',
})
export class AgregarNotaDialogComponent {
  nota: string;
  nombreProducto: string;

  constructor(
    private dialogRef: MatDialogRef<AgregarNotaDialogComponent, string>,
    @Inject(MAT_DIALOG_DATA) data: AgregarNotaDialogData
  ) {
    this.nota = data.nota || '';
    this.nombreProducto = data.nombreProducto;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    this.dialogRef.close(this.nota.trim());
  }

  limpiarNota(): void {
    this.nota = '';
  }
}
