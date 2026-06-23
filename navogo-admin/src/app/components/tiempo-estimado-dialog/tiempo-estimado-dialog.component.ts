import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MatDialogRef,
  MatDialogModule,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface TiempoEstimadoDialogData {
  valorActual?: string;
}

@Component({
  selector: 'app-tiempo-estimado-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
<div class="ted-dialog">

  <div class="ted-header">
    <div class="ted-header__izq">
      <div class="ted-icono-wrap">
        <mat-icon>schedule</mat-icon>
      </div>
      <div>
        <p class="ted-titulo">Tiempo de entrega</p>
        <p class="ted-fecha-hoy">
          Hoy {{ fechaHoyLabel }}
        </p>
      </div>
    </div>
    <button class="ted-cerrar" type="button" (click)="cerrar()">
      <mat-icon>close</mat-icon>
    </button>
  </div>

  <div class="ted-body">

    <div class="ted-ahora">
      <span class="ted-ahora__label">Hora actual</span>
      <span class="ted-ahora__hora">{{ horaAhoraLabel }}</span>
    </div>

    <div class="ted-seccion-label">
      ¿Cuánto tiempo tardará?
    </div>

    <div class="ted-chips">
      @for (op of opciones; track op.minutos) {
        <button
          type="button"
          class="ted-chip"
          [class.ted-chip--activo]="seleccionado === op.minutos"
          (click)="seleccionar(op.minutos)">
          <span class="ted-chip__tiempo">
            {{ op.label }}
          </span>
          <span class="ted-chip__hora">
            {{ getHoraChip(op.minutos) }}
          </span>
        </button>
      }
    </div>

    <div class="ted-separador">
      <span>o define la hora exacta</span>
    </div>

    <div class="ted-hora-manual">
      <div class="ted-hora-display"
           [class.ted-hora-display--activo]="horaManual">
        <mat-icon>access_time</mat-icon>
        <input
          type="time"
          class="ted-hora-input"
          [(ngModel)]="horaManual"
          (ngModelChange)="onHoraManualChange($event)" />
      </div>
    </div>

    @if (valorFinal) {
      <div class="ted-resultado">
        <div class="ted-resultado__izq">
          <mat-icon>check_circle</mat-icon>
          <div>
            <span class="ted-resultado__label">
              Entrega estimada
            </span>
            <span class="ted-resultado__hora">
              {{ getHoraLabel(valorFinal) }} hrs
            </span>
          </div>
        </div>
        <div class="ted-resultado__badge"
             [class.ted-resultado__badge--vence]="
               getMinutosRestantes() <= 15">
          {{ getMinutosLabel() }}
        </div>
      </div>
    }

  </div>

  <div class="ted-footer">
    @if (valorFinal) {
      <button class="ted-btn-limpiar"
              type="button"
              (click)="limpiar()">
        <mat-icon>clear</mat-icon>
        Quitar
      </button>
    }
    <button class="ted-btn-confirmar"
            type="button"
            [disabled]="!valorFinal"
            (click)="confirmar()">
      <mat-icon>check</mat-icon>
      {{ valorFinal ? 'Confirmar ' + getHoraLabel(valorFinal) : 'Selecciona una hora' }}
    </button>
  </div>

</div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: -apple-system, 'Inter', sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .ted-dialog {
      display: flex;
      flex-direction: column;
      width: 380px;
      max-width: 95vw;
      background: #fafaf8;
      border-radius: 16px;
      overflow: hidden;
    }

    .ted-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 20px;
      background: #ffffff;
      border-bottom: 1px solid #e5e3df;

      &__izq {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    }

    .ted-icono-wrap {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: rgba(28,140,64,0.08);
      border: 1px solid rgba(28,140,64,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #1C8C40;
      }
    }

    .ted-titulo {
      font-size: 15px;
      font-weight: 800;
      color: #1A1A11;
      margin: 0 0 2px;
      line-height: 1;
    }

    .ted-fecha-hoy {
      font-size: 12px;
      color: #6b7280;
      margin: 0;
      text-transform: capitalize;
    }

    .ted-cerrar {
      background: none;
      border: none;
      cursor: pointer;
      color: #9ca3af;
      padding: 6px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      transition: all 0.15s;

      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { background: #f5f4f1; color: #1A1A11; }
    }

    .ted-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .ted-ahora {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      border: 1px solid #e5e3df;
      border-radius: 10px;
      padding: 10px 14px;

      &__label {
        font-size: 12px;
        color: #6b7280;
        font-weight: 500;
      }

      &__hora {
        font-size: 16px;
        font-weight: 900;
        color: #1A1A11;
        letter-spacing: -0.02em;
      }
    }

    .ted-seccion-label {
      font-size: 12px;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .ted-chips {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .ted-chip {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      padding: 10px 8px;
      border-radius: 12px;
      border: 1.5px solid #e5e3df;
      background: #ffffff;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s;

      &:hover {
        border-color: #1C8C40;
        background: rgba(28,140,64,0.03);
      }

      &--activo {
        background: #1A1A11;
        border-color: #1A1A11;

        .ted-chip__tiempo { color: #ffffff; }
        .ted-chip__hora   { color: rgba(255,255,255,0.6); }
      }

      &__tiempo {
        font-size: 13px;
        font-weight: 800;
        color: #1A1A11;
        line-height: 1;
      }

      &__hora {
        font-size: 11px;
        font-weight: 500;
        color: #9ca3af;
        line-height: 1;
      }
    }

    .ted-separador {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 11px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.08em;

      &::before,
      &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: #e5e3df;
      }
    }

    .ted-hora-manual {
      display: flex;
      justify-content: center;
    }

    .ted-hora-display {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #ffffff;
      border: 1.5px solid #e5e3df;
      border-radius: 12px;
      padding: 12px 20px;
      width: 100%;
      transition: all 0.15s;

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        color: #9ca3af;
        flex-shrink: 0;
        transition: color 0.15s;
      }

      &--activo {
        border-color: rgba(28,140,64,0.4);
        background: rgba(28,140,64,0.02);

        mat-icon { color: #1C8C40; }
      }
    }

    .ted-hora-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 28px;
      font-weight: 900;
      color: #1A1A11;
      letter-spacing: -0.03em;
      outline: none;
      font-family: inherit;
      width: 100%;

      &::-webkit-calendar-picker-indicator {
        opacity: 0.4;
        cursor: pointer;
        filter: invert(0.3);
      }
    }

    .ted-resultado {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: rgba(28,140,64,0.07);
      border: 1px solid rgba(28,140,64,0.2);
      border-radius: 12px;
      padding: 12px 16px;

      &__izq {
        display: flex;
        align-items: center;
        gap: 10px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: #1C8C40;
          flex-shrink: 0;
        }
      }

      &__label {
        display: block;
        font-size: 11px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        line-height: 1;
        margin-bottom: 3px;
      }

      &__hora {
        display: block;
        font-size: 18px;
        font-weight: 900;
        color: #1A1A11;
        letter-spacing: -0.02em;
        line-height: 1;
      }

      &__badge {
        font-size: 12px;
        font-weight: 700;
        background: #1C8C40;
        color: white;
        border-radius: 20px;
        padding: 5px 12px;
        white-space: nowrap;
        flex-shrink: 0;

        &--vence {
          background: #dc2626;
          animation: parpadeo 1.2s ease infinite;
        }
      }
    }

    @keyframes parpadeo {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.6; }
    }

    .ted-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 20px;
      border-top: 1px solid #e5e3df;
      background: #ffffff;
    }

    .ted-btn-limpiar {
      display: flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: 1px solid #e5e3df;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 600;
      color: #9ca3af;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s;
      flex-shrink: 0;

      mat-icon { font-size: 14px; width: 14px; height: 14px; }
      &:hover { border-color: #dc2626; color: #dc2626; }
    }

    .ted-btn-confirmar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: #1A1A11;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 11px 20px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s;
      flex: 1;

      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover:not(:disabled) { background: #2d2d23; }
      &:disabled {
        background: #e5e3df;
        color: #9ca3af;
        cursor: not-allowed;
      }
    }
  `],
})
export class TiempoEstimadoDialogComponent implements OnInit {
  private dialogRef = inject(
    MatDialogRef<TiempoEstimadoDialogComponent, string | null | undefined>
  );
  data = inject<TiempoEstimadoDialogData | null>(MAT_DIALOG_DATA, { optional: true });

  readonly opciones = [
    { label: '15 min', minutos: 15 },
    { label: '20 min', minutos: 20 },
    { label: '30 min', minutos: 30 },
    { label: '45 min', minutos: 45 },
    { label: '1 hora', minutos: 60 },
    { label: '1:30 hr', minutos: 90 },
  ];

  seleccionado: number | null = null;
  horaManual = '';
  valorFinal = '';

  ngOnInit(): void {
    if (this.data?.valorActual) {
      const fecha = new Date(this.data.valorActual.replace(' ', 'T'));
      if (!Number.isNaN(fecha.getTime())) {
        const h = String(fecha.getHours()).padStart(2, '0');
        const m = String(fecha.getMinutes()).padStart(2, '0');
        this.horaManual = `${h}:${m}`;
        this.valorFinal = this.construirDatetime(this.horaManual);
      }
    }
  }

  get fechaHoyLabel(): string {
    return new Date().toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  get horaAhoraLabel(): string {
    return new Date().toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getHoraChip(minutos: number): string {
    const fecha = new Date();
    fecha.setMinutes(fecha.getMinutes() + minutos);
    return fecha.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  seleccionar(minutos: number): void {
    this.seleccionado = minutos;
    const fecha = new Date();
    fecha.setMinutes(fecha.getMinutes() + minutos);
    const h = String(fecha.getHours()).padStart(2, '0');
    const m = String(fecha.getMinutes()).padStart(2, '0');
    this.horaManual = `${h}:${m}`;
    this.valorFinal = this.construirDatetime(this.horaManual);
  }

  onHoraManualChange(hora: string): void {
    this.seleccionado = null;
    if (!hora) {
      this.valorFinal = '';
      return;
    }
    this.valorFinal = this.construirDatetime(hora);
  }

  private construirDatetime(hora: string): string {
    const hoy = new Date();
    const [h, m] = hora.split(':').map(Number);
    hoy.setHours(h, m, 0, 0);
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    const hStr = String(hoy.getHours()).padStart(2, '0');
    const mStr = String(hoy.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hStr}:${mStr}:00`;
  }

  getHoraLabel(datetime: string): string {
    if (!datetime) return '';
    const d = new Date(datetime.replace(' ', 'T'));
    return d.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getMinutosRestantes(): number {
    if (!this.valorFinal) return 0;
    const diff = new Date(this.valorFinal.replace(' ', 'T')).getTime() - Date.now();
    return Math.round(diff / 60000);
  }

  getMinutosLabel(): string {
    const min = this.getMinutosRestantes();
    if (min <= 0) return 'Ahora';
    if (min < 60) return `en ${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `en ${h}h ${m}m` : `en ${h}h`;
  }

  limpiar(): void {
    this.valorFinal = '';
    this.horaManual = '';
    this.seleccionado = null;
  }

  confirmar(): void {
    this.dialogRef.close(this.valorFinal || null);
  }

  cerrar(): void {
    this.dialogRef.close(undefined);
  }
}
