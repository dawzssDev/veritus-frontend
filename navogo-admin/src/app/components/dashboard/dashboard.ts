import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DashboardService } from '../../services/dashboard/dashboard.service';
import {
  DashboardRecentOrder,
  DashboardSummary,
  DashboardTopProductLast7d,
} from '../../models/dashboard.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string>('');
  readonly summary = signal<DashboardSummary | null>(null);

  readonly kpis = computed(() => this.summary()?.kpis ?? null);
  readonly range = computed(() => this.summary()?.range ?? null);

  readonly recentOrders = computed<DashboardRecentOrder[]>(() => this.summary()?.recent_orders ?? []);
  readonly topProducts = computed<DashboardTopProductLast7d[]>(() => this.summary()?.top_products_last_7d ?? []);

  readonly topRevenueMax = computed(() => {
    const values = this.topProducts().map((p) => Number(p.revenue) || 0);
    return values.length ? Math.max(...values) : 0;
  });

  readonly displayedRecentColumns = ['id', 'status', 'total', 'pago', 'envio', 'created_at', 'actions'] as const;
  readonly displayedTopColumns = ['product_name', 'units', 'revenue'] as const;

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.dashboardService
      .getSummary()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => {
          this.summary.set(data);
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'No fue posible cargar el dashboard.';
          this.errorMessage.set(msg);
        },
      });
  }

  goToOrder(orderId: number): void {
    this.router.navigate(['/pedidos', orderId]);
  }

  orderStatusClass(status: string): string {
    const s = (status || '').toLowerCase();

    if (s.includes('pend')) return 'status-pending';
    if (s.includes('cancel') || s.includes('rech')) return 'status-inactive';
    if (s.includes('complete') || s.includes('entreg') || s.includes('pag')) return 'status-active';

    return 'status-pending';
  }

  boolBadgeClass(v: boolean): string {
    return v ? 'status-active' : 'status-pending';
  }

  revenuePct(value: number): number {
    const max = this.topRevenueMax();
    if (!max) return 0;
    return Math.max(0, Math.min(100, (value / max) * 100));
  }
}
