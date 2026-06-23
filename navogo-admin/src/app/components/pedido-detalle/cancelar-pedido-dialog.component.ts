import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface DialogData {
  folio: number | string;
}

@Component({
  selector: 'app-cancelar-pedido-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-wrap">
      <div class="dialog-header">
        <div class="icon-wrap">
          <mat-icon>cancel</mat-icon>
        </div>
        <div>
          <h2 mat-dialog-title>Cancelar pedido</h2>
          <p class="header-sub">Folio #{{ data.folio }}</p>
        </div>
      </div>

      <mat-dialog-content>
        <p class="mensaje">
          Esta acción <strong>no se puede deshacer</strong>. El pedido quedará
          marcado como cancelado y no podrá ser procesado.
        </p>
        <div class="advertencia">
          <mat-icon>warning_amber</mat-icon>
          <span>¿Estás seguro de que deseas continuar?</span>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-stroked-button (click)="cancelar()">Volver</button>
        <button mat-flat-button class="btn-cancelar" (click)="confirmar()">
          <mat-icon>cancel</mat-icon>
          Cancelar pedido
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-wrap {
      min-width: 360px;
      max-width: 440px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px 24px 12px;

      .icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: #fdecea;
        flex-shrink: 0;

        mat-icon {
          font-size: 26px;
          width: 26px;
          height: 26px;
          color: #c62828;
        }
      }

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: rgba(0,0,0,.87);
        padding: 0;
      }

      .header-sub {
        margin: 2px 0 0;
        font-size: 13px;
        color: rgba(0,0,0,.5);
      }
    }

    mat-dialog-content {
      padding: 0 24px 16px !important;

      .mensaje {
        margin: 0 0 14px;
        font-size: 14px;
        line-height: 1.6;
        color: rgba(0,0,0,.7);

        strong { font-weight: 600; color: rgba(0,0,0,.87); }
      }

      .advertencia {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        background: #fff8e1;
        border-left: 4px solid #f9a825;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        color: #6d4c00;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: #f9a825;
          flex-shrink: 0;
        }
      }
    }

    mat-dialog-actions {
      padding: 8px 24px 20px !important;
      gap: 8px;

      .btn-cancelar {
        background: #c62828;
        color: #fff;
        border-radius: 8px;
        font-weight: 600;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        &:hover { background: #8e0000; }
      }
    }
  `]
})
export class CancelarPedidoDialogComponent {
  private dialogRef = inject(MatDialogRef<CancelarPedidoDialogComponent>);
  public data = inject<DialogData>(MAT_DIALOG_DATA);

  confirmar(): void { this.dialogRef.close(true); }
  cancelar(): void  { this.dialogRef.close(false); }
}
