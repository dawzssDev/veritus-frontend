import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';

export interface PagoCombinadoInput {
  efectivo: number;
  tarjeta: number;
  transferencia: number;
}

export interface ConfirmarPagoDialogData {
  total: number;
  mesaNumero: string;
  contextoLabel?: string;
  metodoPagoActual?: 'efectivo' | 'transferencia' | 'tarjeta' | 'combinado';
  esAdicional?: boolean;
}

export interface ConfirmarPagoDialogResult {
  metodoPago:     'efectivo' | 'transferencia' | 'tarjeta' | 'combinado';
  confirmarEnvio: boolean;
  montoRecibido?: number;
  cambio?:        number;
  pagoCombinado?: PagoCombinadoInput;
}

@Component({
  selector: 'app-confirmar-pago-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    FormsModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="header-icon">payment</mat-icon>
        <h2>Confirmar Pago</h2>
      </div>

      <div
        #dialogContent
        class="dialog-content"
        [style.padding-bottom.px]="keyboardInset() + 12">
        <div class="resumen-pago">
          <span class="resumen-pago__mesa">{{ data.contextoLabel ?? 'Mesa' }} {{ data.mesaNumero }}</span>
          <div class="resumen-pago__total">
            <span class="resumen-pago__label">Total a pagar</span>
            <strong>\${{ data.total.toFixed(2) }}</strong>
          </div>
        </div>

        @if (data.esAdicional) {
          <div class="aviso-adicional">
            <mat-icon>info</mat-icon>
            <span>
              La orden ya fue pagada. Este cobro corresponde
              únicamente a los productos agregados posteriormente.
            </span>
          </div>
        }

        <div class="metodo-pago-section">
          <label class="section-title">Método de pago</label>
          
          <div class="metodos-grid">
            <button 
              type="button"
              class="metodo-btn"
              [class.selected]="metodoPagoSeleccionado() === 'efectivo'"
              (click)="metodoPagoSeleccionado.set('efectivo')">
              <mat-icon>payments</mat-icon>
              <span>Efectivo</span>
            </button>

            <button 
              type="button"
              class="metodo-btn"
              [class.selected]="metodoPagoSeleccionado() === 'tarjeta'"
              (click)="metodoPagoSeleccionado.set('tarjeta')">
              <mat-icon>credit_card</mat-icon>
              <span>Tarjeta</span>
            </button>

            <button 
              type="button"
              class="metodo-btn"
              [class.selected]="metodoPagoSeleccionado() === 'transferencia'"
              (click)="metodoPagoSeleccionado.set('transferencia')">
              <mat-icon>account_balance</mat-icon>
              <span>Transferencia</span>
            </button>

            <button 
              type="button"
              class="metodo-btn"
              [class.selected]="metodoPagoSeleccionado() === 'combinado'"
              (click)="metodoPagoSeleccionado.set('combinado')">
              <mat-icon>splitscreen</mat-icon>
              <span>Combinado</span>
            </button>
          </div>

          <!-- Campo monto recibido — solo para efectivo -->
          @if (metodoPagoSeleccionado() === 'efectivo') {
            <div class="monto-recibido-section">
              <label class="section-title">Monto recibido</label>
              <div class="monto-input-wrapper">
                <span class="monto-prefix">$</span>
                <input
                  type="number"
                  class="monto-input"
                  placeholder="0.00"
                  [value]="montoRecibido() ?? ''"
                  (input)="montoRecibido.set(
                    +$any($event.target).value || null
                  )"
                  (focus)="onInputFocus($event)"
                  inputmode="decimal"
                  min="0"
                  step="0.01" />
              </div>

              @if (cambio() !== null) {
                <div class="cambio-display"
                     [class.cambio-display--ok]="(cambio() ?? 0) >= 0"
                     [class.cambio-display--falta]="(cambio() ?? 0) < 0">
                  @if ((cambio() ?? 0) >= 0) {
                    <mat-icon style="color:#166534">check_circle</mat-icon>
                    <span style="color:#166534;font-weight:800;font-size:16px">Cambio: <strong>
                      \${{ cambio()! | number:'1.2-2' }}
                    </strong></span>
                  } @else {
                    <mat-icon style="color:#dc2626">warning</mat-icon>
                    <span style="color:#dc2626;font-weight:800;font-size:16px">Falta: <strong>
                      \${{ (cambio()! * -1) | number:'1.2-2' }}
                    </strong></span>
                  }
                </div>
              }
            </div>
          }

          @if (metodoPagoSeleccionado() === 'combinado') {
            <div class="pago-combinado-section">
              <label class="section-title">Desglose del pago</label>

              <div class="combinado-fields">
                <div class="combinado-field">
                  <span class="combinado-label">Efectivo</span>
                  <div class="monto-input-wrapper">
                    <span class="monto-prefix">$</span>
                    <input
                      type="number"
                      class="monto-input"
                      placeholder="0.00"
                      [ngModel]="pagoCombinado().efectivo"
                      (ngModelChange)="actualizarPagoCombinado('efectivo', $event)"
                      (focus)="onInputFocus($event)"
                      inputmode="decimal"
                      min="0"
                      step="0.01" />
                  </div>
                </div>

                <div class="combinado-field">
                  <span class="combinado-label">Tarjeta</span>
                  <div class="monto-input-wrapper">
                    <span class="monto-prefix">$</span>
                    <input
                      type="number"
                      class="monto-input"
                      placeholder="0.00"
                      [ngModel]="pagoCombinado().tarjeta"
                      (ngModelChange)="actualizarPagoCombinado('tarjeta', $event)"
                      (focus)="onInputFocus($event)"
                      inputmode="decimal"
                      min="0"
                      step="0.01" />
                  </div>
                </div>

                <div class="combinado-field">
                  <span class="combinado-label">Transferencia</span>
                  <div class="monto-input-wrapper">
                    <span class="monto-prefix">$</span>
                    <input
                      type="number"
                      class="monto-input"
                      placeholder="0.00"
                      [ngModel]="pagoCombinado().transferencia"
                      (ngModelChange)="actualizarPagoCombinado('transferencia', $event)"
                      (focus)="onInputFocus($event)"
                      inputmode="decimal"
                      min="0"
                      step="0.01" />
                  </div>
                </div>
              </div>

              <div class="combinado-resumen">
                <span>Ingresado:</span>
                <strong>\${{ totalCombinadoIngresado() | number:'1.2-2' }}</strong>
              </div>

              @if (cambioCombinado() !== null) {
                <div class="cambio-display"
                     [class.cambio-display--ok]="(cambioCombinado() ?? 0) >= 0"
                     [class.cambio-display--falta]="(cambioCombinado() ?? 0) < 0">
                  @if ((cambioCombinado() ?? 0) >= 0) {
                    <mat-icon style="color:#166534">check_circle</mat-icon>
                    <span style="color:#166534;font-weight:800;font-size:16px">Cambio: <strong>
                      \${{ cambioCombinado()! | number:'1.2-2' }}
                    </strong></span>
                  } @else {
                    <mat-icon style="color:#dc2626">warning</mat-icon>
                    <span style="color:#dc2626;font-weight:800;font-size:16px">Falta: <strong>
                      \${{ (cambioCombinado()! * -1) | number:'1.2-2' }}
                    </strong></span>
                  }
                </div>
              }
            </div>
          }
        </div>

      </div>

      <div class="dialog-actions">
        <button mat-button (click)="cancel()">
          Cancelar
        </button>
        <button 
          mat-flat-button 
          class="btn-confirmar"
          [disabled]="!puedeConfirmar()"
          (click)="confirm()">
          <mat-icon>check_circle</mat-icon>
          Confirmar Pago
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      max-height: inherit;
    }

    .dialog-container {
      display: flex;
      flex-direction: column;
      max-height: min(88vh, 520px);
      width: min(100%, 400px);
      overflow: hidden;
      background: var(--color-bg-surface);
      color: var(--color-text-primary);
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      padding: 14px 16px 12px;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-bg-surface);
      
      .header-icon {
        width: 26px;
        height: 26px;
        font-size: 26px;
        color: #1C8C40;
      }

      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: var(--color-text-primary);
      }
    }

    .dialog-content {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: var(--color-bg-surface);
      color: var(--color-text-primary);
    }

    .resumen-pago {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 12px;
      background: var(--color-bg-surface-2);
      border: 1px solid var(--color-border);
      border-radius: 10px;
    }

    .resumen-pago__mesa {
      font-size: 14px;
      font-weight: 700;
      color: var(--color-text-primary);
      white-space: nowrap;
    }

    .resumen-pago__total {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
      min-width: 0;
    }

    .resumen-pago__label {
      font-size: 11px;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-weight: 600;
    }

    .resumen-pago__total strong {
      font-size: 22px;
      font-weight: 800;
      color: #1C8C40;
      line-height: 1.1;
    }

    .metodo-pago-section {
      .section-title {
        display: block;
        font-size: 13px;
        font-weight: 700;
        color: var(--color-text-primary);
        margin-bottom: 8px;
      }

      .metodos-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
      }

      .metodo-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        min-height: 72px;
        padding: 8px 4px;
        background: var(--color-bg-surface);
        border: 2px solid var(--color-border);
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s;

        mat-icon {
          width: 22px;
          height: 22px;
          font-size: 22px;
          color: var(--color-text-muted);
        }

        span {
          font-size: 11px;
          color: var(--color-text-muted);
          font-weight: 600;
          line-height: 1.2;
          text-align: center;
        }

        &:hover {
          border-color: #1C8C40;
          background: var(--color-brand-light);
        }

        &.selected {
          border-color: #1C8C40;
          background: var(--color-brand-light);

          mat-icon {
            color: #1C8C40;
          }

          span {
            color: #1C8C40;
            font-weight: 600;
          }
        }
      }
    }

    .envio-section {
      padding-top: 8px;
      border-top: 1px solid var(--color-border);

      .checkbox-container {
        display: flex;
        align-items: center;
        cursor: pointer;
        
        .checkbox-input {
          width: 20px;
          height: 20px;
          margin-right: 12px;
          cursor: pointer;
          accent-color: #0F4D2A;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--color-text-primary);

          mat-icon {
            width: 20px;
            height: 20px;
            font-size: 20px;
            color: var(--color-text-muted);
          }
        }
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      flex-shrink: 0;
      padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
      border-top: 1px solid var(--color-border);
      background: var(--color-bg-surface);
      box-shadow: var(--shadow-card);
      z-index: 2;

      button {
        min-width: 96px;
      }

      .btn-confirmar {
        background: #0F4D2A;
        color: white;
        display: flex;
        align-items: center;
        gap: 8px;

        mat-icon {
          width: 20px;
          height: 20px;
          font-size: 20px;
        }

        &:hover {
          background: #0a3a1f;
        }
      }
    }

    .monto-recibido-section {
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .monto-input-wrapper {
      display: flex;
      align-items: center;
      border: 2px solid var(--color-border);
      border-radius: 8px;
      overflow: hidden;
      transition: border-color 0.15s;

      &:focus-within {
        border-color: #0F4D2A;
      }
    }

    .monto-prefix {
      padding: 10px 10px;
      background: var(--color-bg-surface-2);
      font-size: 14px;
      font-weight: 700;
      color: var(--color-text-muted);
      border-right: 2px solid var(--color-border);
    }

    .monto-input {
      flex: 1;
      min-width: 0;
      padding: 10px 12px;
      border: none;
      outline: none;
      font-size: 16px;
      font-weight: 700;
      color: var(--color-text-primary);
      font-family: inherit;
      background: var(--color-bg-surface);
      scroll-margin-bottom: 120px;

      &::placeholder { color: var(--color-text-muted); }

      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    }

    .cambio-display {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 15px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      strong { font-weight: 800; }

      &--ok {
        background: var(--color-success-bg);
        color: #16a34a;
        border: 1.5px solid #16a34a;
        font-weight: 700;
        font-size: 16px;
        mat-icon { color: #16a34a; }
      }

      &--falta {
        background: var(--color-error-bg);
        color: #dc2626;
        font-weight: 700;
        font-size: 16px;
        border: 1.5px solid #dc2626;
        mat-icon { color: #dc2626; }
      }
    }

    .pago-combinado-section {
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .combinado-fields {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }

    .combinado-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .combinado-label {
      font-size: 11px;
      font-weight: 700;
      color: #374151;
      text-align: center;
    }

    .combinado-field .monto-input-wrapper {
      min-width: 0;
    }

    .combinado-field .monto-prefix {
      padding: 8px 6px;
      font-size: 12px;
    }

    .combinado-field .monto-input {
      padding: 8px 6px;
      font-size: 14px;
    }

    .combinado-resumen {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      background: var(--color-bg-surface-2);
      border-radius: 8px;
      font-size: 14px;
      color: #374151;

      strong {
        font-size: 16px;
        color: #0F4D2A;
      }
    }

    .aviso-adicional {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px 12px;
      background: var(--color-warning-bg);
      border: 1px solid #fde68a;
      border-radius: 8px;
      font-size: 12px;
      color: #92400e;
      line-height: 1.45;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #d97706;
        flex-shrink: 0;
        margin-top: 1px;
      }
    }

    @media (max-width: 380px) {
      .metodos-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .combinado-fields {
        grid-template-columns: 1fr;
      }

      .combinado-label {
        text-align: left;
      }

      .dialog-actions {
        flex-direction: column-reverse;

        button {
          width: 100%;
          min-height: 44px;
        }
      }
    }
  `]
})
export class ConfirmarPagoDialogComponent implements OnInit, OnDestroy {
  @ViewChild('dialogContent') dialogContent?: ElementRef<HTMLElement>;

  keyboardInset = signal(0);
  private teardownViewport?: () => void;
  metodoPagoSeleccionado = signal<'efectivo' | 'transferencia' | 'tarjeta' | 'combinado'>('efectivo');
  confirmarEnvio = true;

  montoRecibido = signal<number | null>(null);
  pagoCombinado = signal<PagoCombinadoInput>({
    efectivo: 0,
    tarjeta: 0,
    transferencia: 0,
  });

  totalCombinadoIngresado = computed(() => {
    const p = this.pagoCombinado();
    return (Number(p.efectivo) || 0) + (Number(p.tarjeta) || 0) + (Number(p.transferencia) || 0);
  });

  cambio = computed(() => {
    const recibido = this.montoRecibido();
    if (this.metodoPagoSeleccionado() !== 'efectivo') return null;
    if (recibido === null || recibido === undefined) return null;
    return recibido - this.data.total;
  });

  cambioCombinado = computed(() => {
    if (this.metodoPagoSeleccionado() !== 'combinado') return null;
    const ingresado = this.totalCombinadoIngresado();
    if (ingresado <= 0) return null;
    return ingresado - this.data.total;
  });

  puedeConfirmar = computed(() => {
    const metodo = this.metodoPagoSeleccionado();
    if (metodo === 'efectivo') {
      const recibido = this.montoRecibido();
      return recibido !== null && recibido !== undefined && recibido >= this.data.total;
    }
    if (metodo === 'combinado') {
      return this.totalCombinadoIngresado() >= this.data.total;
    }
    return true;
  });

  actualizarPagoCombinado(
    campo: keyof PagoCombinadoInput,
    valor: string | number | null
  ): void {
    const n = Number(valor);
    this.pagoCombinado.update((actual) => ({
      ...actual,
      [campo]: Number.isFinite(n) ? n : 0,
    }));
  }

  constructor(
    private dialogRef: MatDialogRef<ConfirmarPagoDialogComponent, ConfirmarPagoDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmarPagoDialogData
  ) {
    if (data.metodoPagoActual) {
      this.metodoPagoSeleccionado.set(data.metodoPagoActual);
    }
    // Al pagar desde mesa el envío siempre se confirma
    this.confirmarEnvio = true;
  }

  ngOnInit(): void {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const viewport = window.visualViewport;
    const updateInset = () => {
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      this.keyboardInset.set(Math.round(inset));
    };

    viewport.addEventListener('resize', updateInset);
    viewport.addEventListener('scroll', updateInset);
    updateInset();

    this.teardownViewport = () => {
      viewport.removeEventListener('resize', updateInset);
      viewport.removeEventListener('scroll', updateInset);
    };
  }

  ngOnDestroy(): void {
    this.teardownViewport?.();
  }

  onInputFocus(event: FocusEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    queueMicrotask(() => {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      const container = this.dialogContent?.nativeElement;
      if (!container) return;
      const targetRect = target.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      if (targetRect.bottom > containerRect.bottom - 8) {
        container.scrollTop += targetRect.bottom - containerRect.bottom + 24;
      } else if (targetRect.top < containerRect.top + 8) {
        container.scrollTop -= containerRect.top - targetRect.top + 24;
      }
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    const metodo = this.metodoPagoSeleccionado();
    const result: ConfirmarPagoDialogResult = {
      metodoPago:     metodo,
      confirmarEnvio: this.confirmarEnvio,
    };

    if (metodo === 'efectivo') {
      result.montoRecibido = this.montoRecibido() ?? undefined;
      result.cambio = this.cambio() ?? undefined;
    } else if (metodo === 'combinado') {
      const pago = this.pagoCombinado();
      result.pagoCombinado = {
        efectivo: Number(pago.efectivo) || 0,
        tarjeta: Number(pago.tarjeta) || 0,
        transferencia: Number(pago.transferencia) || 0,
      };
      const cambio = this.cambioCombinado();
      if (cambio != null && cambio > 0) {
        result.cambio = cambio;
      }
    }

    this.dialogRef.close(result);
  }
}
