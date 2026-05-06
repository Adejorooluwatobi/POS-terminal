import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { TillSession, CreateTillSessionDto, UpdateTillSessionDto } from '../models/till-session.model';

@Injectable({
  providedIn: 'root'
})
export class TillSessionService {
  private api = inject(ApiService);
  
  currentSession = signal<TillSession | null>(null);

  constructor() {
    this.loadSessionFromStorage();
  }

  private loadSessionFromStorage() {
    const saved = localStorage.getItem('active_till_session');
    if (saved) {
      try {
        this.currentSession.set(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('active_till_session');
      }
    }
  }

  openSession(dto: CreateTillSessionDto): Observable<TillSession> {
    return this.api.post<TillSession>('/api/till-sessions', dto).pipe(
      tap(session => {
        this.currentSession.set(session);
        localStorage.setItem('active_till_session', JSON.stringify(session));
        localStorage.setItem('till_session_id', session.id);
      })
    );
  }

  closeSession(id: string, dto: UpdateTillSessionDto): Observable<void> {
    return this.api.put<void>(`/api/till-sessions/${id}`, dto).pipe(
      tap(() => {
        this.currentSession.set(null);
        localStorage.removeItem('active_till_session');
        localStorage.removeItem('till_session_id');
      })
    );
  }

  getSessionById(id: string): Observable<TillSession> {
    return this.api.get<TillSession>(`/api/till-sessions/${id}`);
  }

  getActiveSessionForStaff(): Observable<TillSession[]> {
    // This could be a filtered query if the API supports it
    return this.api.get<TillSession[]>('/api/till-sessions');
  }
}
