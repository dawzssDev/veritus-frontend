import {
  Component, OnInit, OnDestroy, Input, Output, EventEmitter,
  signal, inject, HostListener, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ClientesService } from '../../services/clientes/clientes.service';
import { Cliente, Direccion } from '../../models/cliente.interface';

export interface ClienteSeleccionado {
  cliente: Cliente;
  direccion?: Direccion;
}

@Component({
  selector: 'app-cliente-buscador',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './cliente-buscador.component.html',
  styleUrl: './cliente-buscador.component.scss',
})
export class ClienteBuscadorComponent implements OnInit, OnDestroy {
  @Input() tipoVisible: string = 'domicilio';
  @Output() clienteSeleccionado = new EventEmitter<ClienteSeleccionado>();
  @Output() solicitaCrearCliente = new EventEmitter<void>();
  @Output() solicitaCapturarDireccion = new EventEmitter<void>();

  private clientesService = inject(ClientesService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  termino = signal('');
  resultados = signal<Cliente[]>([]);
  buscando = signal(false);
  mostrarDropdown = signal(false);
  clienteActivo = signal<Cliente | null>(null);
  direccionSeleccionada = signal<Direccion | null>(null);
  dirExpandida = signal(false);

  private search$ = new Subject<string>();
  private subs = new Subscription();

  private static readonly SESSION_KEY = 'buscador_termino_pendiente';

  ngOnInit(): void {
    const sub = this.search$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      switchMap(q => {
        if (!q || q.length < 2) {
          this.resultados.set([]);
          this.buscando.set(false);
          return of([]);
        }
        this.buscando.set(true);
        return this.clientesService.buscar(q).pipe(
          catchError(() => {
            this.buscando.set(false);
            return of([]);
          })
        );
      })
    ).subscribe({
      next: (lista: Cliente[]) => {
        this.resultados.set(lista);
        this.buscando.set(false);
        this.mostrarDropdown.set(true);
        this.cdr.detectChanges();
      }
    });
    this.subs.add(sub);

    // Retoma el término de búsqueda al volver de crear un cliente
    const pendiente = sessionStorage.getItem(ClienteBuscadorComponent.SESSION_KEY);
    if (pendiente) {
      sessionStorage.removeItem(ClienteBuscadorComponent.SESSION_KEY);
      setTimeout(() => {
        this.termino.set(pendiente);
        this.search$.next(pendiente);
      }, 150);
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onInput(value: string): void {
    this.termino.set(value);
    this.search$.next(value);
    if (!value) {
      this.mostrarDropdown.set(false);
      this.resultados.set([]);
    } else if (value.length >= 2) {
      this.mostrarDropdown.set(true);
    }
  }

  seleccionar(cliente: Cliente): void {
    this.dirExpandida.set(false);
    this.clienteActivo.set(cliente);
    this.mostrarDropdown.set(false);
    this.termino.set('');
    this.resultados.set([]);

    const dirs = cliente.direcciones ?? [];
    if (dirs.length === 1) {
      this.direccionSeleccionada.set(dirs[0]);
      this.emitir(cliente, dirs[0]);
    } else if (dirs.length === 0) {
      this.direccionSeleccionada.set(null);
      this.emitir(cliente, undefined);
    } else {
      const pred = dirs.find(d => d.predeterminada) ?? dirs[0];
      this.direccionSeleccionada.set(pred);
      this.emitir(cliente, pred);
    }
  }

  onDireccionChange(dir: Direccion): void {
    this.dirExpandida.set(false);
    this.direccionSeleccionada.set(dir);
    const cliente = this.clienteActivo();
    if (cliente) this.emitir(cliente, dir);
  }

  limpiar(): void {
    this.dirExpandida.set(false);
    this.clienteActivo.set(null);
    this.direccionSeleccionada.set(null);
    this.termino.set('');
    this.resultados.set([]);
    this.mostrarDropdown.set(false);
    this.clienteSeleccionado.emit(undefined as any);
  }

  abrirNuevoCliente(): void {
    this.mostrarDropdown.set(false);
    // Guardar el término actual para restaurarlo al volver
    const t = this.termino();
    if (t) sessionStorage.setItem(ClienteBuscadorComponent.SESSION_KEY, t);

    // Emitir evento para que el padre guarde su estado antes de navegar
    this.solicitaCrearCliente.emit();
  }

  primerAlias(cliente: Cliente): string {
    const dirs = cliente.direcciones ?? [];
    return dirs.length > 0 ? dirs[0].alias : '';
  }

  tieneMultiplesDirecciones(): boolean {
    const c = this.clienteActivo();
    return !!c && (c.direcciones?.length ?? 0) > 1;
  }

  /** Dirección activa: la seleccionada o la única del cliente */
  direccionActiva(): Direccion | null {
    const sel = this.direccionSeleccionada();
    if (sel) return sel;
    const dirs = this.clienteActivo()?.direcciones ?? [];
    return dirs.length === 1 ? dirs[0] : null;
  }

  toggleDirDetalle(): void {
    this.dirExpandida.update((v) => !v);
  }

  /** Separa y limpia calle/colonia (evita "123, Centro" en calle o ", Centro" en colonia) */
  parseDireccionPartes(dir: Direccion): { calle: string; colonia: string } {
    let calle = (dir.calle ?? '').toString().trim();
    let colonia = (dir.colonia ?? '')
      .toString()
      .trim()
      .replace(/^,+\s*/, '');

    if (calle.includes(',')) {
      const partes = calle.split(',').map((p) => p.trim()).filter(Boolean);
      if (partes.length > 1) {
        calle = partes[0];
        if (!colonia) {
          colonia = partes.slice(1).join(', ');
        }
      } else {
        calle = partes[0] ?? calle;
      }
    }

    return { calle, colonia };
  }

  calleDisplay(dir: Direccion): string {
    return this.parseDireccionPartes(dir).calle;
  }

  coloniaDisplay(dir: Direccion): string {
    return this.parseDireccionPartes(dir).colonia;
  }

  /** Una línea corta para la fila colapsada (pin + ubicación) */
  resumenDireccion(dir: Direccion): string {
    const { calle, colonia } = this.parseDireccionPartes(dir);
    const linea = [calle, colonia].filter(Boolean).join(', ');
    return linea || (dir.alias ?? '').trim() || 'Ver ubicación';
  }

  @HostListener('document:click', ['$event'])
  onClickFuera(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Verificar tanto el host element como el selector por si hay shadow DOM
    const dentroDelComponente = target.closest('app-cliente-buscador') !== null;
    if (!dentroDelComponente) {
      this.mostrarDropdown.set(false);
    }
  }

  private emitir(cliente: Cliente, direccion?: Direccion): void {
    this.clienteSeleccionado.emit({ cliente, direccion });
  }
}
