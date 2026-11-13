import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, defer, EMPTY, finalize, throwError } from 'rxjs';
import { GlobalErrorHandler } from '../../services/globalErrorHandler/global-error-handler';
import { LoadingService } from '../../services/globalErrorHandler/loading-service/loading.service';

export const globalHttpInterceptorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandler = inject(GlobalErrorHandler);
  const loading = inject(LoadingService);

  return defer(() => {
    loading.start();
    return next(req);
  }).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        errorHandler.handleError(error);
        // Complete failed HTTP requests without emitting a successful response.
        return EMPTY;
      }

      return throwError(() => error);
    }),
    finalize(() => loading.stop()),
  );
};

