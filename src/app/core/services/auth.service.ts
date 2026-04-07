import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface QmUser {
  id?:        number;
  firstName?: string;
  lastName?:  string;
  email:      string;
  role?:      string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'qm_token';
  private readonly USER_KEY  = 'qm_user';
  private readonly api       = environment.apiUrl;

  token$ = new BehaviorSubject<string | null>(localStorage.getItem(this.TOKEN_KEY));
  user$  = new BehaviorSubject<QmUser | null>(
    JSON.parse(localStorage.getItem(this.USER_KEY) || 'null')
  );

  get token():   string | null { return this.token$.value; }
  get user():    QmUser | null  { return this.user$.value; }
  get loggedIn(): boolean       { return !!this.token$.value; }

  get initials(): string {
    const u = this.user;
    if (!u) return '';
    return ((u.firstName?.[0] || '') + (u.lastName?.[0] || '')).toUpperCase()
        || u.email[0].toUpperCase();
  }

  get displayName(): string {
    const u = this.user;
    if (!u) return '';
    return u.firstName || u.email;
  }

  constructor(private http: HttpClient) {}

  async getMe(): Promise<QmUser | null> {
    try {
      const data = await firstValueFrom(
        this.http.get<QmUser>(`${this.api}/api/auth/me`)
      );
      return data;
    } catch {
      return null;
    }
  }

  private saveSession(token: string, user: QmUser): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.token$.next(token);
    this.user$.next(user);
  }

  async login(email: string, password: string): Promise<{ ok: boolean; message?: string }> {
    try {
      const data: any = await firstValueFrom(
        this.http.post(`${this.api}/api/auth/login`, { email, password })
      );
      this.saveSession(data.accessToken, data.user);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, message: err?.error?.message || 'Login failed' };
    }
  }

  async register(payload: { email: string; password: string; firstName?: string; lastName?: string }): Promise<{ ok: boolean; message?: string }> {
    try {
      const data: any = await firstValueFrom(
        this.http.post(`${this.api}/api/auth/register`, payload)
      );
      this.saveSession(data.accessToken, data.user);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, message: err?.error?.message || 'Registration failed' };
    }
  }

  async googleLogin(idToken: string): Promise<{ ok: boolean; message?: string }> {
    try {
      const data: any = await firstValueFrom(
        this.http.post(`${this.api}/api/auth/google`, { idToken })
      );
      this.saveSession(data.accessToken, data.user);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, message: err?.error?.message || 'Google login failed' };
    }
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.token$.next(null);
    this.user$.next(null);
  }
}
