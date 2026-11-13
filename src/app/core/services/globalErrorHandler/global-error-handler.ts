import { NgZone, Injectable } from '@angular/core';
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
  readonly horizontalPosition: MatSnackBarHorizontalPosition = 'right';
  readonly verticalPosition: MatSnackBarVerticalPosition = 'bottom';

  constructor(
    private readonly snackBar: MatSnackBar,
    private readonly zone: NgZone,
  ) {}

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
