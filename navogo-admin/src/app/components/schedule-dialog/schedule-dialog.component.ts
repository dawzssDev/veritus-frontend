import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';

export type ScheduleDayKey =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo';

export interface DaySchedule {
  is_open: boolean;
  open?: string;
  close?: string;
}

export type WeeklySchedule = Partial<Record<ScheduleDayKey, DaySchedule>>;

@Component({
  selector: 'app-schedule-dialog',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor],
  templateUrl: './schedule-dialog.component.html',
  styleUrl: './schedule-dialog.component.scss',
})
export class ScheduleDialogComponent implements OnChanges, OnDestroy {
  @Input() open = false;
  @Input() horarios: WeeklySchedule | null = null;

  @Output() openChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild('dialog', { static: false }) dialogRef?: ElementRef<HTMLElement>;
  @ViewChild('closeButton', { static: false }) closeButtonRef?: ElementRef<HTMLButtonElement>;

  readonly days: ScheduleDayKey[] = [
    'lunes',
    'martes',
    'miercoles',
    'jueves',
    'viernes',
    'sabado',
    'domingo',
  ];

  private previousBodyOverflow: string | null = null;
  private restoreFocusTo: HTMLElement | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      if (this.open) this.onOpen();
      else this.onCloseSideEffects();
    }
  }

  ngOnDestroy(): void {
    this.onCloseSideEffects();
  }

  close(): void {
    this.open = false;
    this.openChange.emit(false);
    this.closed.emit();
    this.onCloseSideEffects();
  }

  onOverlayClick(): void {
    this.close();
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.open) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  isToday(day: ScheduleDayKey): boolean {
    const now = new Date();
    const currentDay = (['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const)[
      now.getDay()
    ];
    return day === currentDay;
  }

  formatDayName(day: ScheduleDayKey): string {
    const map: Record<ScheduleDayKey, string> = {
      lunes: 'Lunes',
      martes: 'Martes',
      miercoles: 'Miércoles',
      jueves: 'Jueves',
      viernes: 'Viernes',
      sabado: 'Sábado',
      domingo: 'Domingo',
    };
    return map[day];
  }

  formatTime(time: string | undefined): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  private onOpen(): void {
    this.restoreFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    queueMicrotask(() => {
      this.closeButtonRef?.nativeElement?.focus();
    });
  }

  private onCloseSideEffects(): void {
    if (this.previousBodyOverflow !== null) {
      document.body.style.overflow = this.previousBodyOverflow;
      this.previousBodyOverflow = null;
    }

    if (this.restoreFocusTo) {
      queueMicrotask(() => this.restoreFocusTo?.focus());
      this.restoreFocusTo = null;
    }
  }

  private trapFocus(event: KeyboardEvent): void {
    const root = this.dialogRef?.nativeElement;
    if (!root) return;

    const focusables = Array.from(
      root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));

    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (!active || active === first) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
