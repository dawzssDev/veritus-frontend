import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

export type StatusToastKind = 'success' | 'info';

export interface StatusToastData {
  title: string;
  detail?: string;
  icon?: string;
  kind?: StatusToastKind;
}

@Component({
  selector: 'app-status-toast',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './status-toast.component.html',
  styleUrl: './status-toast.component.scss',
})
export class StatusToastComponent {
  readonly data: StatusToastData;

  constructor(@Inject(MAT_SNACK_BAR_DATA) data: StatusToastData) {
    this.data = {
      icon: 'check_circle',
      kind: 'success',
      ...data,
    };
  }
}
