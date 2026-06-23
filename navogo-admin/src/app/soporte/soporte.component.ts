import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe }             from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule }          from '@angular/material/card';
import { MatButtonModule }        from '@angular/material/button';
import { MatIconModule }          from '@angular/material/icon';
import { MatFormFieldModule }     from '@angular/material/form-field';
import { MatInputModule }         from '@angular/material/input';
import { MatDividerModule }       from '@angular/material/divider';
import { MatChipsModule }         from '@angular/material/chips';
import { MatTooltipModule }       from '@angular/material/tooltip';
import { MatProgressBarModule }   from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { TicketService }          from './ticket.service';
import { Ticket }                 from './ticket.interface';
import { TicketDetalleDialogComponent }
  from './dialogs/ticket-detalle.dialog';

@Component({
  selector:    'app-soporte',
  standalone:  true,
  imports: [
    CommonModule, DatePipe, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule,
    MatDividerModule, MatChipsModule, MatTooltipModule,
    MatProgressBarModule, MatDialogModule,
  ],
  templateUrl: './soporte.component.html',
  styleUrl:    './soporte.component.scss',
})
export class SoporteComponent implements OnInit {
  private service = inject(TicketService);
  private fb      = inject(FormBuilder);
  private dialog  = inject(MatDialog);

  tickets     = signal<Ticket[]>([]);
  cargando    = signal<boolean>(true);
  guardando   = signal<boolean>(false);
  enviado     = signal<boolean>(false);
  error       = signal<string | null>(null);
  vistaActual = signal<'nuevo' | 'historial'>('nuevo');

  form = this.fb.group({
    titulo: ['', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(200),
    ]],
    descripcion: ['', [
      Validators.required,
      Validators.minLength(20),
      Validators.maxLength(3000),
    ]],
    categoria: ['soporte_tecnico', Validators.required],
    prioridad: ['media',           Validators.required],
  });

  readonly categorias = [
    { valor: 'soporte_tecnico', label: 'Soporte técnico',  icono: 'build',       desc: 'Problemas con el sistema' },
    { valor: 'facturacion',     label: 'Facturación',      icono: 'receipt',     desc: 'Pagos y suscripción' },
    { valor: 'funcionalidad',   label: 'Funcionalidad',    icono: 'tune',        desc: 'Cómo usar el sistema' },
    { valor: 'reporte_error',   label: 'Reporte de error', icono: 'bug_report',  desc: 'Algo no funciona bien' },
    { valor: 'consulta',        label: 'Consulta general', icono: 'help',        desc: 'Preguntas generales' },
    { valor: 'otro',            label: 'Otro',             icono: 'more_horiz',  desc: 'Cualquier otro tema' },
  ];

  readonly prioridades = [
    { valor: 'alta',  label: 'Alta',  color: '#dc2626', icono: 'keyboard_double_arrow_up',   desc: 'El negocio no puede operar' },
    { valor: 'media', label: 'Media', color: '#d97706', icono: 'drag_handle',                desc: 'Afecta parcialmente la operación' },
    { valor: 'baja',  label: 'Baja',  color: '#1C8C40', icono: 'keyboard_double_arrow_down', desc: 'No es urgente' },
  ];

  ngOnInit(): void {
    this.cargarTickets();
  }

  cargarTickets(): void {
    this.cargando.set(true);
    this.service.getTickets().subscribe({
      next:  (res) => { this.tickets.set(res.data); this.cargando.set(false); },
      error: ()    => this.cargando.set(false),
    });
  }

  enviar(): void {
    if (this.form.invalid || this.guardando()) return;
    this.guardando.set(true);
    this.error.set(null);

    this.service.crear(this.form.value as any).subscribe({
      next: () => {
        this.guardando.set(false);
        this.enviado.set(true);
        this.form.reset({ categoria: 'soporte_tecnico', prioridad: 'media' });
        this.cargarTickets();
        setTimeout(() => this.enviado.set(false), 4000);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'Error al enviar el ticket');
      },
    });
  }

  verDetalle(ticket: Ticket): void {
    this.dialog.open(TicketDetalleDialogComponent, {
      data:       { ticket },
      width:      '560px',
      maxWidth:   '95vw',
      panelClass: 'dawrz-dialog',
    });
  }

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

  get charCount(): number {
    return this.form.get('descripcion')?.value?.length ?? 0;
  }
}
