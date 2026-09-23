import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.status === 0) {
        errorMessage = 'Network connection lost. Please check your internet.';
      } else {
        switch (error.status) {
          case 401:
            errorMessage = 'Unauthorized: Invalid credentials or session expired.';
            break;
          case 403:
            errorMessage = 'Forbidden: You do not have permission for this action.';
            break;
          case 404:
            errorMessage = 'Not Found: The requested resource does not exist.';
            break;
          case 400:
            errorMessage = error.error?.message || 'Bad Request: Invalid data submitted.';
            break;
          case 500:
            errorMessage = 'Server Error: Something went wrong on our end.';
            break;
          default:
            errorMessage = `Error ${error.status}: ${error.error?.message || error.statusText}`;
        }
      }

      // Suppress error toast for background sync requests or unauthenticated public routes (pairing/login)
      const isPublicRoute = typeof window !== 'undefined' && 
        (window.location.pathname.includes('/pairing') || window.location.pathname.includes('/login'));
      const isPublicEndpoint = req.url.includes('/auth/login') || req.url.includes('/terminals/pair') || req.url.includes('/transactions/sync');
      const isUnauthWithoutToken = error.status === 401 && !localStorage.getItem('pos_token');

      if (!req.url.includes('/transactions/sync') && !(error.status === 401 && (isPublicRoute || isPublicEndpoint || isUnauthWithoutToken))) {
        notify.error(errorMessage);
      }
      return throwError(() => error);
    })
  );
};
