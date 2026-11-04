import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

export interface AdminSession {
  id_erab: number;
  izena: string;
  email: string;
  id_rol: number;
}

const SESSION_KEY = 'administrazio_admin_session';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly loginUrl = 'http://localhost:8000/alokaziosistema/login/admin';

  private readonly sessionSignal = signal<AdminSession | null>(this.readSession());

  readonly session = this.sessionSignal.asReadonly();
  readonly isLoggedIn = computed(() => {
    const session = this.sessionSignal();
    return session !== null && session.id_rol === 1;
  });

  constructor(private http: HttpClient) {}

  loginAdmin(email: string, pasahitza: string): Observable<AdminSession> {
    return this.http
      .post<AdminSession>(this.loginUrl, { email, pasahitza })
      .pipe(
        tap((session) => {
          if (session.id_rol !== 1) {
            throw new Error('Kontu honek ez du administrazio baimenik');
          }
          this.saveSession(session);
        }),
      );
  }

  logout(): void {
    this.sessionSignal.set(null);
    localStorage.removeItem(SESSION_KEY);
  }

  private saveSession(session: AdminSession): void {
    this.sessionSignal.set(session);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  private readSession(): AdminSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) {
        return null;
      }

      const session = JSON.parse(raw) as AdminSession;
      if (!session || session.id_rol !== 1) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }

      return session;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }
}
