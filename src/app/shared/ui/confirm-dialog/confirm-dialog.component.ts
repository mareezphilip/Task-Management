import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) protected readonly data: ConfirmDialogData,
    private readonly dialogRef: MatDialogRef<ConfirmDialogComponent, boolean>,
  ) {}

  protected close(confirmed: boolean): void {
    this.dialogRef.close(confirmed);
  }
}
