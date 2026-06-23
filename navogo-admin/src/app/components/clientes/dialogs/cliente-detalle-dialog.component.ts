import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ClientesService } from '../../../services/clientes/clientes.service';
import { Cliente, Direccion } from '../../../models/cliente.interface';
import { ClienteFormDialogComponent } from './cliente-form-dialog.component';

export interface ClienteDetalleData {
  clienteId: number;
}

@Component({
  selector: 'app-cliente-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatChipsModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="dialog-header">
      <mat-icon class="header-icon">person</mat-icon>
      <h2 mat-dialog-title>Detalle de cliente</h2>
      <span class="spacer"></span>
      <button mat-icon-button class="btn-edit-header"
              matTooltip="Editar cliente"
              (click)="editarCliente()"
              [disabled]="cargando()">
        <mat-icon>edit</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="detalle-content">

      @if (cargando()) {
        <div class="loading-wrap">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando datos...</p>
        </div>
      }

      @if (!cargando() && cliente()) {
        <!-- Datos del cliente -->
        <section class="seccion-datos">
          <div class="dato-row">
            <mat-icon>person</mat-icon>
            <div>
              <small>Nombre</small>
              <strong>{{ cliente()!.nombre }}</strong>
            </div>
          </div>
          <div class="dato-row">
            <mat-icon>phone</mat-icon>
            <div>
              <small>Teléfono</small>
              <strong>{{ cliente()!.telefono }}</strong>
            </div>
          </div>
          @if (cliente()!.email) {
            <div class="dato-row">
              <mat-icon>email</mat-icon>
              <div>
                <small>Correo</small>
                <strong>{{ cliente()!.email }}</strong>
              </div>
            </div>
          }
          <div class="dato-row">
            <mat-icon>receipt_long</mat-icon>
            <div>
              <small>Total pedidos</small>
              <strong>{{ cliente()!.total_pedidos }}</strong>
            </div>
          </div>
          @if (cliente()!.ultimo_pedido) {
            <div class="dato-row">
              <mat-icon>schedule</mat-icon>
              <div>
                <small>Último pedido</small>
                <strong>{{ cliente()!.ultimo_pedido | date:'dd/MM/yyyy HH:mm' }}</strong>
              </div>
            </div>
          }
          @if (cliente()!.notas) {
            <div class="dato-row notas">
              <mat-icon>notes</mat-icon>
              <div>
                <small>Notas</small>
                <span>{{ cliente()!.notas }}</span>
              </div>
            </div>
          }
        </section>

        <mat-divider></mat-divider>

        <!-- Direcciones -->
        <section class="seccion-direcciones">
          <div class="dir-header">
            <h3><mat-icon>location_on</mat-icon> Direcciones</h3>
            <button mat-stroked-button class="btn-add-dir" (click)="mostrarFormDir.set(true)"
                    *ngIf="!mostrarFormDir()">
              <mat-icon>add</mat-icon> Agregar
            </button>
          </div>

          <!-- Formulario nueva dirección -->
          @if (mostrarFormDir()) {
            <form [formGroup]="dirForm" class="dir-form">
              <mat-form-field appearance="outline" class="half-field">
                <mat-label>Alias</mat-label>
                <input matInput formControlName="alias" placeholder="Casa, Trabajo...">
                @if (dirForm.get('alias')?.hasError('required') && dirForm.get('alias')?.touched) {
                  <mat-error>Requerido</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline" class="half-field">
                <mat-label>Ciudad</mat-label>
                <input matInput formControlName="ciudad" placeholder="Ciudad">
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-field">
                <mat-label>Calle y número</mat-label>
                <input matInput formControlName="calle" placeholder="Av. Principal 123">
                @if (dirForm.get('calle')?.hasError('required') && dirForm.get('calle')?.touched) {
                  <mat-error>Requerido</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-field">
                <mat-label>Colonia</mat-label>
                <input matInput formControlName="colonia" placeholder="Col. Centro">
                @if (dirForm.get('colonia')?.hasError('required') && dirForm.get('colonia')?.touched) {
                  <mat-error>Requerido</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-field">
                <mat-label>Referencia (opcional)</mat-label>
                <input matInput formControlName="referencia" placeholder="Entre calles, punto de referencia...">
              </mat-form-field>

              @if (errorDir()) {
                <p class="form-error">{{ errorDir() }}</p>
              }

              <div class="dir-form-actions">
                <button mat-stroked-button type="button"
                        (click)="mostrarFormDir.set(false); dirForm.reset()">
                  Cancelar
                </button>
                <button mat-raised-button class="btn-save-dir" type="button"
                        (click)="guardarDireccion()"
                        [disabled]="guardandoDir()">
                  @if (guardandoDir()) {
                    <mat-spinner diameter="16"></mat-spinner>
                  } @else {
                    <mat-icon>save</mat-icon>
                  }
                  Guardar
                </button>
              </div>
            </form>
          }

          <!-- Lista de direcciones -->
          @if ((cliente()!.direcciones?.length ?? 0) === 0 && !mostrarFormDir()) {
            <p class="sin-datos">Sin direcciones registradas</p>
          }

          @for (dir of cliente()!.direcciones; track dir.id) {
            <div class="dir-card" [class.predeterminada]="dir.predeterminada">
              @if (dir.predeterminada) {
                <span class="badge-pred">
                  <mat-icon>star</mat-icon> Principal
                </span>
              }
              <div class="dir-top">
                <strong>{{ dir.alias }}</strong>
                <button mat-icon-button class="btn-del-dir"
                        matTooltip="Eliminar dirección"
                        (click)="eliminarDireccion(dir)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
              <p class="dir-calle">{{ dir.calle }}, {{ dir.colonia }}</p>
              @if (dir.ciudad) {
                <p class="dir-ciudad">{{ dir.ciudad }}</p>
              }
              @if (dir.referencia) {
                <p class="dir-ref">
                  <mat-icon>info</mat-icon>{{ dir.referencia }}
                </p>
              }
            </div>
          }
        </section>
      }

      @if (!cargando() && !cliente() && errorCarga()) {
        <p class="error-carga">{{ errorCarga() }}</p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="dialogRef.close()">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 24px;
      background: linear-gradient(135deg, #1A1A11 0%, #1C8C40 100%);
      margin: -24px -24px 0;
      border-radius: 4px 4px 0 0;

      .header-icon { color: #fff; font-size: 24px; width: 24px; height: 24px; }
      h2 { color: #fff; margin: 0; padding: 0 !important; font-size: 17px; font-weight: 600; }
      .spacer { flex: 1; }
      .btn-edit-header { color: rgba(255,255,255,0.8); }
    }

    .detalle-content {
      padding-top: 16px !important;
      min-width: 320px;
      max-width: 520px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .loading-wrap {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 32px; color: #666;
    }

    .seccion-datos {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-bottom: 16px;
    }

    .dato-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;

      mat-icon { color: #1C8C40; margin-top: 2px; font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }

      div {
        display: flex; flex-direction: column; gap: 1px;
        small { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
        strong { font-size: 14px; color: #1a1a1a; }
      }

      &.notas div span { font-size: 13px; color: #555; white-space: pre-wrap; }
    }

    .seccion-direcciones {
      padding-top: 16px;

      .dir-header {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 12px;

        h3 {
          margin: 0; font-size: 15px; font-weight: 600; color: #1a1a1a;
          display: flex; align-items: center; gap: 6px;
          mat-icon { font-size: 18px; width: 18px; height: 18px; color: #1C8C40; }
        }

        .btn-add-dir { color: #1C8C40; border-color: #1C8C40; font-size: 13px; height: 32px; line-height: 32px; }
      }
    }

    .dir-form {
      display: flex;
      flex-wrap: wrap;
      gap: 0 8px;
      background: #f8f9fa;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;

      .half-field { width: calc(50% - 4px); }
      .full-field { width: 100%; }

      .form-error {
        width: 100%; color: #e53935; font-size: 13px; margin: 0;
        padding: 6px 10px; background: rgba(229,57,53,0.08); border-radius: 6px;
      }

      .dir-form-actions {
        width: 100%; display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px;
      }

      .btn-save-dir {
        background: #1C8C40 !important; color: white !important;
        display: inline-flex; align-items: center; gap: 6px;
      }
    }

    .dir-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 8px;
      border-left: 3px solid #ddd;
      position: relative;

      &.predeterminada { border-left-color: #1C8C40; }

      .badge-pred {
        display: inline-flex; align-items: center; gap: 4px;
        font-size: 11px; color: #1C8C40; font-weight: 600; margin-bottom: 4px;
        mat-icon { font-size: 12px; width: 12px; height: 12px; }
      }

      .dir-top {
        display: flex; justify-content: space-between; align-items: center;
        strong { font-size: 14px; color: #1a1a1a; }
        .btn-del-dir { color: #ccc; width: 28px; height: 28px;
          mat-icon { font-size: 16px; width: 16px; height: 16px; }
          &:hover { color: #e53935; }
        }
      }

      .dir-calle { margin: 4px 0 2px; font-size: 13px; color: #555; }
      .dir-ciudad { margin: 0 0 2px; font-size: 12px; color: #888; }
      .dir-ref {
        margin: 4px 0 0; font-size: 12px; color: #888;
        display: flex; align-items: center; gap: 4px;
        mat-icon { font-size: 13px; width: 13px; height: 13px; }
      }
    }

    .sin-datos { color: #999; font-size: 13px; text-align: center; padding: 16px 0; }
    .error-carga { color: #e53935; font-size: 13px; text-align: center; padding: 20px; }

    mat-dialog-actions { padding: 10px 24px 16px; }
  `]
})
export class ClienteDetalleDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<ClienteDetalleDialogComponent>);
  private clientesService = inject(ClientesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  cargando = signal(true);
  cliente = signal<Cliente | null>(null);
  errorCarga = signal('');
  mostrarFormDir = signal(false);
  guardandoDir = signal(false);
  errorDir = signal('');

  dirForm = this.fb.group({
    alias:      ['', Validators.required],
    calle:      ['', Validators.required],
    colonia:    ['', Validators.required],
    ciudad:     [''],
    referencia: [''],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: ClienteDetalleData) {}

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.clientesService.getById(this.data.clienteId).subscribe({
      next: (c) => { this.cliente.set(c); this.cargando.set(false); },
      error: (err) => {
        this.errorCarga.set(err?.error?.message ?? 'Error al cargar el cliente');
        this.cargando.set(false);
      }
    });
  }

  editarCliente(): void {
    const c = this.cliente();
    if (!c) return;
    const ref = this.dialog.open(ClienteFormDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      data: { cliente: c },
    });
    ref.afterClosed().subscribe({
      next: (actualizado: Cliente | undefined) => {
        if (actualizado) {
          this.cliente.set(actualizado);
          this.snackBar.open('Cliente actualizado', 'OK', { duration: 2000 });
        }
      }
    });
  }

  guardarDireccion(): void {
    if (this.dirForm.invalid) { this.dirForm.markAllAsTouched(); return; }
    const c = this.cliente();
    if (!c) return;

    this.guardandoDir.set(true);
    this.errorDir.set('');
    this.clientesService.agregarDireccion(c.id, this.dirForm.value as any).subscribe({
      next: (nueva) => {
        const actual = this.cliente()!;
        this.cliente.set({ ...actual, direcciones: [...(actual.direcciones ?? []), nueva] });
        this.guardandoDir.set(false);
        this.mostrarFormDir.set(false);
        this.dirForm.reset();
        this.snackBar.open('Dirección agregada', 'OK', { duration: 2000 });
      },
      error: (err) => {
        this.guardandoDir.set(false);
        this.errorDir.set(err?.error?.message ?? 'Error al agregar dirección');
      }
    });
  }

  eliminarDireccion(dir: Direccion): void {
    const c = this.cliente();
    if (!c) return;
    this.clientesService.eliminarDireccion(c.id, dir.id).subscribe({
      next: () => {
        const actual = this.cliente()!;
        this.cliente.set({
          ...actual,
          direcciones: actual.direcciones.filter(d => d.id !== dir.id)
        });
        this.snackBar.open('Dirección eliminada', 'OK', { duration: 2000 });
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Error al eliminar dirección', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
