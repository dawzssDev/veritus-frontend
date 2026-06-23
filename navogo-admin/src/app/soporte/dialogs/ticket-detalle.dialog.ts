import { Component, inject }    from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  MatDialogModule, MatDialogRef, MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonModule }  from '@angular/material/button';
import { MatIconModule }    from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Ticket }           from '../ticket.interface';

@Component({
  selector:   'app-ticket-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule, DatePipe,
    MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule,
  ],
  template: `
<div class="td-dialog">

  <!-- Header -->
  <div class="td-header">
    <div class="td-header__izq">
      <code class="td-num">{{ data.ticket.numero_ticket }}</code>
      <span class="td-estatus"
            [style.background]="getColorEstatus(data.ticket.estatus) + '18'"
            [style.color]="getColorEstatus(data.ticket.estatus)">
        <mat-icon>{{ getIconoEstatus(data.ticket.estatus) }}</mat-icon>
        {{ data.ticket.estatus_label ?? data.ticket.estatus }}
      </span>
    </div>
    <button mat-icon-button mat-dialog-close>
      <mat-icon>close</mat-icon>
    </button>
  </div>

  <!-- Barra de prioridad -->
  <div class="td-prioridad-bar"
       [style.background]="getColorPrioridad(data.ticket.prioridad)">
  </div>

  <!-- Body -->
  <mat-dialog-content class="td-body">

    <h2 class="td-titulo">{{ data.ticket.titulo }}</h2>

    <div class="td-chips">
      <span class="td-chip">
        <mat-icon>category</mat-icon>
        {{ data.ticket.categoria_label ?? data.ticket.categoria }}
      </span>
      <span class="td-chip td-chip--prioridad"
            [style.color]="getColorPrioridad(data.ticket.prioridad)"
            [style.background]="getColorPrioridad(data.ticket.prioridad) + '15'">
        <mat-icon>priority_high</mat-icon>
        Prioridad {{ data.ticket.prioridad_label ?? data.ticket.prioridad }}
      </span>
      <span class="td-chip">
        <mat-icon>schedule</mat-icon>
        {{ data.ticket.created_at | date:'d MMM yyyy · HH:mm' }}
      </span>
    </div>

    <mat-divider></mat-divider>

    <div class="td-seccion">
      <p class="td-seccion-label">Descripción</p>
      <div class="td-descripcion">{{ data.ticket.descripcion }}</div>
    </div>

    @if (data.ticket.respuesta_admin) {
      <mat-divider></mat-divider>
      <div class="td-seccion">
        <p class="td-seccion-label">
          <mat-icon>support_agent</mat-icon>
          Respuesta del equipo de soporte
        </p>
        <div class="td-respuesta">
          <mat-icon class="td-respuesta__icono">reply</mat-icon>
          <p>{{ data.ticket.respuesta_admin }}</p>
        </div>
        @if (data.ticket.respondido_en) {
          <p class="td-respondido-en">
            Respondido el {{ data.ticket.respondido_en | date:'d MMM yyyy · HH:mm' }}
          </p>
        }
      </div>
    }

  </mat-dialog-content>

  <mat-divider></mat-divider>

  <mat-dialog-actions align="end" style="padding: 12px 16px;">
    <button mat-flat-button color="primary" mat-dialog-close>
      Cerrar
    </button>
  </mat-dialog-actions>

</div>
  `,
  styles: [`
    .td-dialog { display: flex; flex-direction: column; min-width: 0; }

    .td-header {
      display: flex; justify-content: space-between;
      align-items: center; padding: 12px 12px 12px 20px; gap: 10px;
    }
    .td-header__izq { display: flex; align-items: center; gap: 10px; }

    .td-num {
      font-family: monospace; font-size: 14px; font-weight: 700;
      background: #f3f4f6; border-radius: 6px; padding: 4px 10px;
      color: #111;
    }

    .td-estatus {
      display: inline-flex; align-items: center; gap: 4px;
      border-radius: 20px; padding: 3px 10px;
      font-size: 12px; font-weight: 700;
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }

    .td-prioridad-bar { height: 3px; }

    .td-body {
      padding: 16px 20px !important;
      display: flex; flex-direction: column; gap: 14px;
      max-height: 60vh; overflow-y: auto;
    }

    .td-titulo { font-size: 18px; font-weight: 800; color: #111; margin: 0; }

    .td-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .td-chip {
      display: inline-flex; align-items: center; gap: 4px;
      background: #f3f4f6; border-radius: 8px; padding: 5px 10px;
      font-size: 12px; color: #374151;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .td-chip--prioridad { font-weight: 700; }

    .td-seccion { display: flex; flex-direction: column; gap: 8px; }

    .td-seccion-label {
      display: flex; align-items: center; gap: 5px;
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; color: #9ca3af; margin: 0;
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
    }

    .td-descripcion {
      background: #f9fafb; border-radius: 10px; padding: 14px;
      font-size: 14px; color: #374151;
      line-height: 1.7; white-space: pre-wrap;
    }

    .td-respuesta {
      display: flex; align-items: flex-start; gap: 10px;
      background: rgba(28,140,64,0.06);
      border: 1px solid rgba(28,140,64,0.2);
      border-radius: 10px; padding: 14px;
    }
    .td-respuesta__icono { color: #1C8C40; flex-shrink: 0; margin-top: 2px; }
    .td-respuesta p { font-size: 14px; color: #374151; margin: 0; line-height: 1.6; }

    .td-respondido-en { font-size: 12px; color: #9ca3af; margin: 4px 0 0; }
  `],
})
export class TicketDetalleDialogComponent {
  data = inject<{ ticket: Ticket }>(MAT_DIALOG_DATA);

  getColorPrioridad(p: string): string {
    return ({ alta: '#dc2626', media: '#d97706', baja: '#1C8C40' } as any)[p] ?? '#6b7280';
  }

  getColorEstatus(e: string): string {
    return ({
      abierto: '#185FA5', en_revision: '#854F0B',
      resuelto: '#1C8C40', cerrado: '#6b7280',
    } as any)[e] ?? '#6b7280';
  }

  getIconoEstatus(e: string): string {
    return ({
      abierto: 'inbox', en_revision: 'manage_search',
      resuelto: 'check_circle', cerrado: 'lock',
    } as any)[e] ?? 'help';
  }
}
