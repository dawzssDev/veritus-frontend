import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface DialogData {
  identificador: string;
  pagado: boolean;
}

@Component({
  selector: 'app-confirmar-liberar-mesa-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './confirmar-liberar-mesa.dialog.html',
  styleUrl: './confirmar-liberar-mesa.dialog.scss'
})
export class ConfirmarLiberarMesaDialogComponent {
  private dialogRef = inject(MatDialogRef<ConfirmarLiberarMesaDialogComponent>);
  public data = inject<DialogData>(MAT_DIALOG_DATA);

  confirmar(): void { this.dialogRef.close(true); }
  cancelar(): void  { this.dialogRef.close(false); }
}
