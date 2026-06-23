import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient }    from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface EstadoTrial {
  en_trial:         boolean;
  dias_restantes:   number;
  trial_fin:        string | null;
  plan:             string | null;
  estatus:          string | null;
}

@Injectable({ providedIn: 'root' })
export class TrialService {
  private http   = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  estado = signal<EstadoTrial | null>(null);
  cargado = signal<boolean>(false);

  // Computed helpers
  enTrial = computed(() =>
    this.estado()?.en_trial === true
  );

  diasRestantes = computed(() =>
    this.estado()?.dias_restantes ?? 0
  );

  urgente = computed(() => {
    const d = this.diasRestantes();
    return d <= 3 && d >= 0;
  });

  advertencia = computed(() => {
    const d = this.diasRestantes();
    return d > 3 && d <= 7;
  });

  cargar(): void {
    if (this.cargado()) return;

    this.http.get<{ data: any }>(
      `${this.apiUrl}/stripe/resumen-facturacion`
    ).subscribe({
      next: (res) => {
        const data = res.data;
        this.estado.set({
          en_trial:       data.estatus === 'trialing',
          dias_restantes: data.dias_trial ?? 0,
          trial_fin:      data.trial_fin ?? null,
          plan:           data.plan_actual ?? null,
          estatus:        data.estatus ?? null,
        });
        this.cargado.set(true);
      },
      error: () => this.cargado.set(true)
    });
  }

  limpiar(): void {
    this.estado.set(null);
    this.cargado.set(false);
  }
}
