import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Mesa } from '../../../../models/mesa.interface';
import { MesaService } from '../../../../services/mesas/mesa.service';

interface DialogData {
  mesa: Mesa;
}

@Component({
  selector: 'app-confirmar-eliminar-mesa-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './confirmar-eliminar-mesa.dialog.html',
  styleUrl: './confirmar-eliminar-mesa.dialog.scss'
})
export class ConfirmarEliminarMesaDialogComponent {
  private dialogRef = inject(MatDialogRef<ConfirmarEliminarMesaDialogComponent>);
  public data = inject<DialogData>(MAT_DIALOG_DATA);
  private mesaService = inject(MesaService);

  eliminando = signal(false);
  errorMensaje = signal('');

  get mesa(): Mesa {
    return this.data.mesa;
  }

  get tieneComandaActiva(): boolean {
    return this.mesa.estado !== 'libre' && this.mesa.estado !== 'reservada';
  }

  get puedeEliminar(): boolean {
    return !this.tieneComandaActiva;
  }

  eliminar() {
    if (!this.puedeEliminar || this.eliminando()) {
      return;
    }

    this.eliminando.set(true);
    this.errorMensaje.set('');

    this.mesaService.delete(this.mesa.id).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.eliminando.set(false);
        
        if (err.error?.message) {
          this.errorMensaje.set(err.error.message);
        } else {
          this.errorMensaje.set('Error al eliminar la mesa. Intenta nuevamente.');
        }
      }
    });
  }

  cancelar() {
    this.dialogRef.close(false);
  }
}
