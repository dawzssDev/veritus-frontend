import { Component, output, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';

export type FiltroTipo = 'todos' | 'local' | 'domicilio' | 'recoger';
export type FiltroModo = 'todos' | 'pendientes';

@Component({
  selector: 'app-orders-filter-bar',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
  ],
  templateUrl: './orders-filter-bar.component.html',
  styleUrl: './orders-filter-bar.component.scss'
})
export class OrdersFilterBarComponent {
  // Two-way binding usando model()
  selectedDate = model<Date>(new Date());
  filtroModo = model<FiltroModo>('pendientes');
  filtroTipo = model<FiltroTipo>('todos');
  
  // Outputs
  refresh = output<void>();
  
  onDateChange(date: Date | null) {
    if (date) {
      this.selectedDate.set(date);
    }
  }
  
  onModoChange(modo: FiltroModo) {
    this.filtroModo.set(modo);
  }
  
  onTipoChange(tipo: FiltroTipo) {
    this.filtroTipo.set(tipo);
  }
  
  goToToday() {
    this.selectedDate.set(new Date());
  }
  
  onRefresh() {
    this.refresh.emit();
  }
  
  get isToday(): boolean {
    const today = new Date();
    const selected = this.selectedDate();
    return selected.getDate() === today.getDate() &&
           selected.getMonth() === today.getMonth() &&
           selected.getFullYear() === today.getFullYear();
  }
}
