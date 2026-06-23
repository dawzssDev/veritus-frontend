import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CatalogoComplementosService } from '../../services/catalogo-complementos/catalogo-complementos.service';
import { ProductAdicionalGroup } from '../../models/business.interface';

@Component({
  selector: 'app-importar-catalogo-dialog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="importar-dialog">
      <div class="importar-dialog__header">
        <div class="importar-dialog__titulo">
          <mat-icon>library_add</mat-icon>
          <div>
            <h2>Importar del catálogo</h2>
            <p>Selecciona los grupos que quieres agregar a este producto.</p>
          </div>
        </div>
        <button
          type="button"
          class="importar-dialog__cerrar"
          mat-dialog-close
          aria-label="Cerrar">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="importar-dialog__content">
        @if (cargando()) {
          <div class="importar-dialog__loading">
            <mat-spinner diameter="36" />
            <span>Cargando catálogo...</span>
          </div>
        } @else if (error()) {
          <div class="importar-dialog__estado importar-dialog__estado--error">
            <mat-icon>error_outline</mat-icon>
            <p>{{ error() }}</p>
          </div>
        } @else if (grupos().length === 0) {
          <div class="importar-dialog__estado">
            <mat-icon>tune</mat-icon>
            <p>No hay complementos en el catálogo</p>
            <a
              routerLink="/catalogo/complementos"
              class="importar-dialog__link"
              (click)="cancelar()">
              Ir al catálogo
              <mat-icon>open_in_new</mat-icon>
            </a>
          </div>
        } @else {
          <div class="importar-dialog__lista">
            @for (grupo of grupos(); track catalogoId(grupo)) {
              <button
                type="button"
                class="grupo-card"
                [class.grupo-card--sel]="isSelected(catalogoId(grupo))"
                (click)="toggleGrupo(catalogoId(grupo))">
                <div class="grupo-card__check">
                  @if (isSelected(catalogoId(grupo))) {
                    <mat-icon>check_circle</mat-icon>
                  } @else {
                    <mat-icon>radio_button_unchecked</mat-icon>
                  }
                </div>
                <div class="grupo-card__body">
                  <span class="grupo-card__titulo">{{ grupo.titulo }}</span>
                  <span class="grupo-card__meta">
                    {{ grupo.opciones.length }}
                    {{ grupo.opciones.length === 1 ? 'opción' : 'opciones' }}:
                    {{ extrasPreview(grupo) }}
                  </span>
                </div>
              </button>
            }
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions class="importar-dialog__actions" align="end">
        <span class="importar-dialog__count">
          {{ seleccionados().size }}
          {{ seleccionados().size === 1 ? 'grupo seleccionado' : 'grupos seleccionados' }}
        </span>
        <div class="importar-dialog__btns">
          <button mat-stroked-button type="button" (click)="cancelar()">
            Cancelar
          </button>
          <button
            mat-flat-button
            type="button"
            color="primary"
            [disabled]="seleccionados().size === 0"
            (click)="confirmar()">
            Importar seleccionados
          </button>
        </div>
      </mat-dialog-actions>
    </div>
  `,
  styles: `
    :host { display: block; }
    .importar-dialog { display: flex; flex-direction: column; min-width: 0; }
    .importar-dialog__header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 12px; padding: 20px 24px 0;
    }
    .importar-dialog__titulo {
      display: flex; align-items: flex-start; gap: 12px; min-width: 0;
    }
    .importar-dialog__titulo > mat-icon {
      flex-shrink: 0; font-size: 24px; width: 24px; height: 24px;
      color: #1c8c40; margin-top: 2px;
    }
    .importar-dialog__titulo h2 {
      margin: 0; font-size: 18px; font-weight: 800; color: #1a1a11;
    }
    .importar-dialog__titulo p {
      margin: 4px 0 0; font-size: 13px; color: #6b7280; line-height: 1.45;
    }
    .importar-dialog__cerrar {
      flex-shrink: 0; background: none; border: none; cursor: pointer;
      color: #6b7280; padding: 6px; border-radius: 8px; display: flex;
    }
    .importar-dialog__cerrar:hover { background: #f5f4f1; color: #1a1a11; }
    .importar-dialog__content {
      padding: 16px 24px !important; margin: 0 !important;
      max-height: min(420px, 55vh) !important; overflow: hidden !important;
    }
    .importar-dialog__loading {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 12px; padding: 48px 16px;
      color: #6b7280; font-size: 14px;
    }
    .importar-dialog__estado {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; padding: 40px 16px; text-align: center; color: #6b7280;
    }
    .importar-dialog__estado mat-icon {
      font-size: 40px; width: 40px; height: 40px; color: #d1cdc7;
    }
    .importar-dialog__estado p { margin: 0; font-size: 14px; }
    .importar-dialog__estado--error mat-icon { color: #dc2626; }
    .importar-dialog__link {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 13px; font-weight: 600; color: #1c8c40; text-decoration: none;
    }
    .importar-dialog__link mat-icon {
      font-size: 14px; width: 14px; height: 14px; color: #1c8c40;
    }
    .importar-dialog__lista {
      display: flex; flex-direction: column; gap: 8px;
      overflow-y: auto; max-height: min(380px, 50vh); padding-right: 2px;
    }
    .grupo-card {
      display: flex; align-items: flex-start; gap: 12px; width: 100%;
      text-align: left; padding: 14px 16px; background: #fff;
      border: 1.5px solid #e5e3df; border-radius: 12px; cursor: pointer;
      font-family: inherit; transition: border-color 0.15s, background 0.15s;
    }
    .grupo-card:hover {
      border-color: #1c8c40; background: rgba(28, 140, 64, 0.02);
    }
    .grupo-card--sel {
      border-color: #1c8c40; background: rgba(28, 140, 64, 0.06);
      box-shadow: 0 0 0 1px rgba(28, 140, 64, 0.12);
    }
    .grupo-card__check mat-icon {
      font-size: 22px; width: 22px; height: 22px; color: #9ca3af;
    }
    .grupo-card--sel .grupo-card__check mat-icon { color: #1c8c40; }
    .grupo-card__body {
      display: flex; flex-direction: column; gap: 4px; min-width: 0;
    }
    .grupo-card__titulo { font-size: 14px; font-weight: 700; color: #1a1a11; }
    .grupo-card__meta { font-size: 12px; color: #6b7280; line-height: 1.4; }
    .importar-dialog__actions {
      display: flex !important; flex-wrap: wrap; align-items: center;
      justify-content: space-between !important; gap: 12px;
      padding: 12px 24px 20px !important; margin: 0 !important;
      border-top: 1px solid #e5e3df;
    }
    .importar-dialog__count {
      font-size: 12px; font-weight: 600; color: #6b7280;
    }
    .importar-dialog__btns { display: flex; gap: 8px; flex-wrap: wrap; }
  `,
})
export class ImportarCatalogoDialogComponent implements OnInit {
  cargando = signal(true);
  grupos = signal<ProductAdicionalGroup[]>([]);
  seleccionados = signal<Set<number>>(new Set());
  error = signal<string | null>(null);

  private service = inject(CatalogoComplementosService);
  dialogRef = inject(MatDialogRef<ImportarCatalogoDialogComponent>);

  ngOnInit(): void {
    this.service.getAll().subscribe({
      next: (grupos) => {
        this.grupos.set(grupos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el catálogo de complementos.');
        this.cargando.set(false);
      },
    });
  }

  catalogoId(grupo: ProductAdicionalGroup): number {
    return (
      grupo.catalogo_id ??
      (typeof grupo.id === 'number' ? grupo.id : Number(grupo.id))
    );
  }

  toggleGrupo(id: number): void {
    const next = new Set(this.seleccionados());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.seleccionados.set(next);
  }

  isSelected(id: number): boolean {
    return this.seleccionados().has(id);
  }

  extrasPreview(grupo: ProductAdicionalGroup): string {
    const list = grupo.opciones ?? [];
    const preview = list.slice(0, 3).map((o) => o.extra).join(', ');
    return list.length > 3 ? `${preview}...` : preview;
  }

  confirmar(): void {
    const selected = this.grupos().filter((g) =>
      this.seleccionados().has(this.catalogoId(g))
    );
    if (selected.length === 0) return;
    this.dialogRef.close(selected);
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
