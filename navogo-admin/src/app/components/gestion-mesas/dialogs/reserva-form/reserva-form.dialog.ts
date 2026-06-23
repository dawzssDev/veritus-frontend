import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReservaService } from '../../reserva.service';
import { Reserva, DisponibilidadMesa } from '../../reserva.interface';
import { MesaService } from '../../../../services/mesas/mesa.service';

interface DialogData {
  reserva?: Reserva;
  fecha: Date;
}

@Component({
  selector: 'app-reserva-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './reserva-form.dialog.html',
  styleUrl: './reserva-form.dialog.scss',
})
export class ReservaFormDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ReservaFormDialogComponent>);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  private reservaService = inject(ReservaService);
  private mesaService = inject(MesaService);

  guardando = signal<boolean>(false);
  error = signal<string | null>(null);
  mesas = signal<any[]>([]);
  disponibilidad = signal<DisponibilidadMesa[]>([]);
  buscandoDisp = signal<boolean>(false);
  esEdicion = computed(() => !!this.data.reserva);

  form = new FormGroup({
    mesa_id: new FormControl<number | null>(
      this.data.reserva?.mesa_id ?? null,
      Validators.required
    ),
    nombre_cliente: new FormControl(this.data.reserva?.nombre_cliente ?? '', [
      Validators.required,
      Validators.minLength(2),
    ]),
    telefono_cliente: new FormControl(this.data.reserva?.telefono_cliente ?? ''),
    email_cliente: new FormControl(
      this.data.reserva?.email_cliente ?? '',
      Validators.email
    ),
    num_personas: new FormControl(this.data.reserva?.num_personas ?? 2, [
      Validators.required,
      Validators.min(1),
      Validators.max(50),
    ]),
    fecha: new FormControl(
      this.data.reserva?.fecha ?? this.toLocalDateString(this.data.fecha ?? new Date()),
      Validators.required
    ),
    hora_inicio: new FormControl(this.data.reserva?.hora_inicio ?? '19:00', Validators.required),
    notas: new FormControl(this.data.reserva?.notas ?? ''),
  });

  readonly filtroFecha = (fecha: Date | null): boolean => {
    if (!fecha) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fecha >= hoy;
  };

  readonly horasOpciones = Array.from({ length: 32 }, (_, i) => {
    const h = Math.floor(i / 2) + 8;
    const m = i % 2 === 0 ? '00' : '30';
    return {
      valor: `${h.toString().padStart(2, '0')}:${m}`,
      label: `${h.toString().padStart(2, '0')}:${m}`,
    };
  });

  get fechaDate(): Date | null {
    const f = this.form.get('fecha')?.value;
    if (!f) return null;
    return new Date(f + 'T12:00:00');
  }

  ngOnInit(): void {
    this.mesaService.getAll().subscribe({
      next: (res) => {
        const data = (res as any)?.data ?? [];
        this.mesas.set(data);
      },
      error: () => this.mesas.set([])
    });
    if (this.data.reserva) {
      this.verificarDisponibilidad();
    }
  }

  verificarDisponibilidad(): void {
    const f = this.form.value;
    if (!f.fecha || !f.hora_inicio) return;

    this.buscandoDisp.set(true);
    this.reservaService
      .getDisponibilidad({
        fecha: f.fecha!,
        hora_inicio: f.hora_inicio!,
        duracion_minutos: 60,
      })
      .subscribe({
        next: (res) => {
          this.disponibilidad.set(res.data);
          this.buscandoDisp.set(false);
        },
        error: () => this.buscandoDisp.set(false),
      });
  }

  onFechaCambio(fecha: Date | null): void {
    if (!fecha) return;
    this.form.patchValue({ fecha: this.toLocalDateString(fecha) });
    this.verificarDisponibilidad();
  }

  private toLocalDateString(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  guardar(): void {
    if (this.form.invalid || this.guardando()) return;
    this.guardando.set(true);
    this.error.set(null);

    const payload = { ...this.form.value, duracion_minutos: 60 };

    const req$ = this.esEdicion()
      ? this.reservaService.actualizar(this.data.reserva!.id, payload)
      : this.reservaService.crear(payload);

    req$.subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.dialogRef.close(res.data);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'Error al guardar la reserva');
      },
    });
  }
}
