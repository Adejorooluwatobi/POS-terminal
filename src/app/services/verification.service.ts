import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  private api = inject(ApiService);

  startLivenessSession(customerId?: string, purpose: string = 'FaceVerification'): Observable<any> {
    return this.api.post<any>('/api/verification/liveness/start', {
      customerId: customerId || null,
      purpose
    });
  }

  verifyLivenessStep(sessionId: string, step: string, telemetry?: string): Observable<any> {
    return this.api.post<any>('/api/verification/liveness/step', {
      sessionId,
      step,
      telemetry: telemetry || `Completed step ${step} at ${new Date().toISOString()}`
    });
  }

  completeLiveness(sessionId: string, photoBase64: string, auditLog: string, customerId?: string): Observable<any> {
    return this.api.post<any>('/api/verification/liveness/complete', {
      sessionId,
      photoBase64,
      auditLog,
      customerId: customerId || null
    });
  }
}
