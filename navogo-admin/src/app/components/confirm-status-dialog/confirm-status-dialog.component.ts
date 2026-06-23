import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export type ConfirmStatusKind = 'pago' | 'envio' | 'neutral' | 'cancelar';

export interface ConfirmStatusDialogData {
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  icon?: string;
  kind?: ConfirmStatusKind;
  meta?: string;
  hint?: string;
}

@Component({
  selector: 'app-confirm-status-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './confirm-status-dialog.component.html',
  styleUrl: './confirm-status-dialog.component.scss',
})
export class ConfirmStatusDialogComponent {
  readonly data: ConfirmStatusDialogData;

  constructor(
    private dialogRef: MatDialogRef<ConfirmStatusDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) data: ConfirmStatusDialogData
  ) {
    this.data = {
      cancelText: 'Cancelar',
      icon: 'help',
      kind: 'neutral',
      ...data,
    };
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
