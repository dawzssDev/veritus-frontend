import {
  Component, OnInit, inject, computed
} from '@angular/core';
import { RouterLink }    from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule }  from '@angular/common';
import { TrialService }  from '../../services/trial/trial.service';

@Component({
  selector:    'app-trial-banner',
  standalone:  true,
  imports:     [CommonModule, RouterLink, MatIconModule],
  templateUrl: './trial-banner.component.html',
  styleUrls:   ['./trial-banner.component.scss'],
})
export class TrialBannerComponent implements OnInit {
  trialService = inject(TrialService);

  // Mensaje dinámico según días restantes
  mensaje = computed(() => {
    const d = this.trialService.diasRestantes();
    const plan = this.trialService.estado()?.plan ?? '';
    const planLabel = plan
      ? plan.charAt(0).toUpperCase() + plan.slice(1)
      : '';

    if (d === 0) {
      return `⚠️ Tu período de prueba
        ${planLabel ? 'del Plan ' + planLabel : ''}
        vence HOY.`;
    }
    if (d === 1) {
      return `⚠️ Te queda 1 día de prueba
        ${planLabel ? 'del Plan ' + planLabel : ''}.`;
    }
    return `Te quedan ${d} días de tu período de prueba
      ${planLabel ? 'del Plan ' + planLabel : ''}.`;
  });

  porcentaje = computed(() => {
    const d = this.trialService.diasRestantes();
    // Trial de 14 días
    return Math.max(0, Math.min(100, (d / 14) * 100));
  });

  ngOnInit(): void {
    this.trialService.cargar();
  }
}
