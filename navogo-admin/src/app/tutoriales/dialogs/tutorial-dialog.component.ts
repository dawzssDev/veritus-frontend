import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Tutorial } from '../tutoriales.component';

@Component({
  selector: 'app-tutorial-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './tutorial-dialog.component.html',
  styleUrl: './tutorial-dialog.component.scss',
})
export class TutorialDialogComponent {
  public dialogRef = inject(MatDialogRef<TutorialDialogComponent>);
  public data = inject<{ tutorial: Tutorial }>(MAT_DIALOG_DATA);
}
