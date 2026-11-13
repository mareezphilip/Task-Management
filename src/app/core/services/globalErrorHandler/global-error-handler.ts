import { inject, Injectable, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class GlobalErrorHandler {
  private readonly snackBar = inject(MatSnackBar);
  private readonly zone = inject(NgZone);
  readonly horizontalPosition: MatSnackBarHorizontalPosition = 'right';
  readonly verticalPosition: MatSnackBarVerticalPosition = 'bottom';

  handleError(error: HttpErrorResponse): void {
    const message = this.getErrorMessage(error);

    this.zone.run(() => {
      this.snackBar.open(message, '', {
        horizontalPosition: this.horizontalPosition,
        verticalPosition: this.verticalPosition,
        panelClass: ['errorSnakBar'],
        duration: 5000,
      });
    });
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    // Prefer the API's message, then fall back to Angular's HTTP message.
    const serverMessage = error.error?.message;
    if (typeof serverMessage === 'string' && serverMessage.trim()) {
      return serverMessage;
    }

    return error.message || 'An unexpected error occurred. Please try again.';
  }
}
