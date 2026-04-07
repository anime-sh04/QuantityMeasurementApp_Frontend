import { Component, OnInit } from '@angular/core';
import { NgIf, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from './auth-modal.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [NgIf, AsyncPipe, FormsModule],
  template: `
    <div class="modal-overlay"
      [class.open]="modal.isOpen"
      (click)="onOverlayClick($event)">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">
            {{ (modal.form$ | async) === 'login' ? 'Login' : 'Create Account' }}
          </div>
          <button class="modal-close" (click)="modal.close()">✕</button>
        </div>

        <!-- LOGIN FORM -->
        <div *ngIf="(modal.form$ | async) === 'login'">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" type="email"
              [(ngModel)]="loginEmail"
              placeholder="you@example.com" />
          </div>
          <div class="form-spacer"></div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input class="form-input" type="password"
              [(ngModel)]="loginPassword"
              placeholder="••••••••"
              (keydown.enter)="doLogin()" />
          </div>
          <div class="form-spacer"></div>
          <button class="btn btn-primary"
            style="width:100%;justify-content:center;"
            [disabled]="loginLoading"
            (click)="doLogin()">
            <span *ngIf="loginLoading" class="spinner"></span>
            <span *ngIf="!loginLoading">Login →</span>
          </button>
          <div class="divider-text">or</div>
          <button class="btn-google" (click)="googleLogin()">
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          <div class="auth-switch">
            No account?
            <button (click)="modal.switchForm('register')">Register here</button>
          </div>
        </div>

        <!-- REGISTER FORM -->
        <div *ngIf="(modal.form$ | async) === 'register'">
          <div class="stagger-row stagger-row-even">
            <div class="form-group">
              <label class="form-label">First Name</label>
              <input class="form-input" type="text" [(ngModel)]="regFirst" placeholder="Alice" />
            </div>
            <div class="form-group">
              <label class="form-label">Last Name</label>
              <input class="form-input" type="text" [(ngModel)]="regLast" placeholder="Smith" />
            </div>
          </div>
          <div class="form-spacer"></div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" type="email" [(ngModel)]="regEmail" placeholder="you@example.com" />
          </div>
          <div class="form-spacer"></div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input class="form-input" type="password"
              [(ngModel)]="regPassword"
              placeholder="••••••••"
              (keydown.enter)="doRegister()" />
          </div>
          <div class="form-spacer"></div>
          <button class="btn btn-primary"
            style="width:100%;justify-content:center;"
            [disabled]="regLoading"
            (click)="doRegister()">
            <span *ngIf="regLoading" class="spinner"></span>
            <span *ngIf="!regLoading">Create Account →</span>
          </button>
          <div class="divider-text">or</div>
          <button class="btn-google" (click)="googleLogin()">
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Register with Google
          </button>
          <div class="auth-switch">
            Have an account?
            <button (click)="modal.switchForm('login')">Login here</button>
          </div>
        </div>

        <div id="g-btn-container" style="margin-top:8px;display:flex;justify-content:center;"></div>
      </div>
    </div>
  `
})
export class AuthModalComponent {
  // Login fields
  loginEmail    = '';
  loginPassword = '';
  loginLoading  = false;

  // Register fields
  regFirst    = '';
  regLast     = '';
  regEmail    = '';
  regPassword = '';
  regLoading  = false;

  constructor(
    public  modal: AuthModalService,
    private auth:  AuthService,
    private toast: ToastService
  ) {}

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.modal.close();
    }
  }

  async doLogin(): Promise<void> {
    if (!this.loginEmail || !this.loginPassword) {
      this.toast.show('Fill in all fields', 'error'); return;
    }
    this.loginLoading = true;
    const result = await this.auth.login(this.loginEmail, this.loginPassword);
    this.loginLoading = false;
    if (result.ok) {
      this.modal.close();
      this.toast.show(`Welcome back, ${this.auth.displayName}!`);
      this.loginEmail = ''; this.loginPassword = '';
    } else {
      this.toast.show(result.message || 'Login failed', 'error');
    }
  }

  async doRegister(): Promise<void> {
    if (!this.regEmail || !this.regPassword) {
      this.toast.show('Email and password required', 'error'); return;
    }
    if (this.regPassword.length < 8) {
      this.toast.show('Password must be at least 8 characters', 'error'); return;
    }
    this.regLoading = true;
    const result = await this.auth.register({
      email: this.regEmail, password: this.regPassword,
      firstName: this.regFirst, lastName: this.regLast
    });
    this.regLoading = false;
    if (result.ok) {
      this.modal.close();
      this.toast.show(`Welcome, ${this.auth.displayName}!`);
      this.regFirst = ''; this.regLast = ''; this.regEmail = ''; this.regPassword = '';
    } else {
      this.toast.show(result.message || 'Registration failed', 'error');
    }
  }

  googleLogin(): void {
    if (typeof google === 'undefined') {
      this.toast.show('Google library not loaded', 'error'); return;
    }
    const container = document.getElementById('g-btn-container')!;
    container.innerHTML = '';
    google.accounts.id.initialize({
      client_id:   environment.googleClientId,
      callback:    (resp: any) => this.handleGoogleCredential(resp),
      auto_select: false
    });
    google.accounts.id.prompt((n: any) => {
      if (n.isNotDisplayed() || n.isSkippedMoment()) {
        google.accounts.id.renderButton(container, { theme: 'outline', size: 'large', width: 356 });
      }
    });
  }

  async handleGoogleCredential(response: any): Promise<void> {
    const result = await this.auth.googleLogin(response.credential);
    if (result.ok) {
      this.modal.close();
      this.toast.show(`Welcome, ${this.auth.displayName}!`);
    } else {
      this.toast.show(result.message || 'Google login failed', 'error');
    }
  }
}
