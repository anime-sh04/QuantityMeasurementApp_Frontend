import { Component } from '@angular/core';
import { AsyncPipe, NgIf, NgFor, NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService, QmUser } from '../../core/services/auth.service';
import { AuthModalService } from '../../auth/auth-modal/auth-modal.service';
import { ConverterStateService, MeasurementType } from '../../core/services/converter-state.service';
import { ThemeService } from '../../core/services/theme.service';
import { OP_TITLES } from '../../core/constants';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [AsyncPipe, NgIf, NgFor, NgClass, RouterLink, RouterLinkActive],
  styles: [`
    .topbar-title-desktop { display: block; }
    .topbar-title-mobile  { display: none;  }
    @media (max-width: 820px) {
      .topbar-title-desktop { display: none;  }
      .topbar-title-mobile  { display: block; }
    }
    .user-chip { cursor: pointer; position: relative; }
    .user-chip:hover { border-color: var(--accent); }

    .profile-popup-overlay {
      position: fixed; inset: 0; z-index: 300;
    }
    .profile-popup {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      min-width: 260px;
      background: var(--surface);
      border: 1.5px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-lg);
      padding: 1.4rem;
      z-index: 400;
      animation: popIn 0.18s ease;
    }
    @keyframes popIn {
      from { opacity:0; transform: translateY(-8px) scale(0.97); }
      to   { opacity:1; transform: none; }
    }
    .profile-avatar-lg {
      width: 52px; height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--accent3));
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; font-weight: 700; color: #fff;
      font-family: var(--font-mono);
      margin: 0 auto 1rem;
    }
    .profile-name {
      font-family: var(--font-disp);
      font-size: 1.1rem; font-weight: 700;
      text-align: center; color: var(--text);
      margin-bottom: 0.2rem;
    }
    .profile-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 7px 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.78rem;
    }
    .profile-row:last-of-type { border-bottom: none; }
    .profile-key {
      font-family: var(--font-mono); font-size: 0.6rem;
      text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted);
    }
    .profile-val { color: var(--text2); font-weight: 500; }
    .profile-role-badge {
      background: var(--accent-soft); color: var(--accent);
      border: 1px solid var(--accent);
      border-radius: 20px; padding: 2px 10px;
      font-family: var(--font-mono); font-size: 0.6rem;
      text-transform: uppercase; letter-spacing: 0.1em;
    }
    .profile-loading {
      text-align: center; padding: 1rem 0;
      color: var(--muted); font-size: 0.8rem;
    }
  `],
  template: `
    <!-- Top bar -->
    <div class="topbar">
      <span class="topbar-title topbar-title-desktop">{{ title$ | async }}</span>
      <span class="topbar-title topbar-title-mobile">
        <span style="font-family:var(--font-disp);font-size:1.3rem;font-weight:700;letter-spacing:-0.03em;">QM</span>
      </span>
      <div class="topbar-right">
        <ng-container *ngIf="auth.user$ | async as user; else loggedOut">

          <!-- Clickable user chip -->
          <div class="user-chip" style="position:relative;" (click)="toggleProfile()">
            <div class="user-avatar">{{ auth.initials }}</div>
            <span class="topbar-title-desktop">{{ auth.displayName }}</span>

            <!-- Profile popup -->
            <ng-container *ngIf="profileOpen">
              <!-- invisible overlay to close on outside click -->
              <div class="profile-popup-overlay" (click)="closeProfile($event)"></div>
              <div class="profile-popup" (click)="$event.stopPropagation()">

                <div *ngIf="profileLoading" class="profile-loading">
                  <span class="spinner spinner-dk"></span> Loading…
                </div>

                <ng-container *ngIf="!profileLoading && profile">
                  <div class="profile-avatar-lg">{{ auth.initials }}</div>
                  <div class="profile-name">{{ profile.firstName }} {{ profile.lastName }}</div>

                  <div style="margin-top:1rem;">
                    <div class="profile-row">
                      <span class="profile-key">Email</span>
                      <span class="profile-val">{{ profile.email }}</span>
                    </div>
                    <div class="profile-row">
                      <span class="profile-key">First name</span>
                      <span class="profile-val">{{ profile.firstName || '—' }}</span>
                    </div>
                    <div class="profile-row">
                      <span class="profile-key">Last name</span>
                      <span class="profile-val">{{ profile.lastName || '—' }}</span>
                    </div>
                    <div class="profile-row">
                      <span class="profile-key">Role</span>
                      <span class="profile-role-badge">{{ profile.role || 'User' }}</span>
                    </div>
                  </div>

                  <button class="btn btn-danger btn-sm"
                    style="width:100%;justify-content:center;margin-top:1.2rem;"
                    (click)="auth.logout(); closeProfile($event)">
                    Logout
                  </button>
                </ng-container>
              </div>
            </ng-container>
          </div>

          <button class="btn btn-ghost btn-sm topbar-title-desktop" (click)="auth.logout()">Logout</button>
        </ng-container>
        <ng-template #loggedOut>
          <button class="btn btn-ghost btn-sm"   (click)="modal.open('login')">Login</button>
          <button class="btn btn-primary btn-sm" (click)="modal.open('register')">Register</button>
        </ng-template>
      </div>
    </div>

    <!-- Mobile bottom navigation -->
    <nav class="mobile-nav">
      <a class="mobile-nav-item" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
        <span class="mobile-nav-icon">⇄</span>
        <span>Convert</span>
      </a>
      <a class="mobile-nav-item" routerLink="/history" routerLinkActive="active">
        <span class="mobile-nav-icon">◷</span>
        <span>History</span>
      </a>
      <div class="mobile-nav-divider"></div>
      <button *ngFor="let t of types" class="mobile-nav-item"
        [ngClass]="{ active: (state.type$ | async) === t.value }"
        (click)="setType(t.value)">
        <span class="mobile-nav-icon">
          <span class="type-dot" [ngClass]="'dot-' + t.value" style="width:10px;height:10px;display:inline-block;border-radius:50%;"></span>
        </span>
        <span>{{ t.label }}</span>
      </button>
      <div class="mobile-nav-divider"></div>
      <button class="mobile-nav-item" (click)="theme.toggle()">
        <span class="mobile-nav-icon">{{ theme.icon }}</span>
        <span>Theme</span>
      </button>
      

    </nav>
  `
})
export class TopbarComponent {
  title$: Observable<string>;
  profileOpen   = false;
  profileLoading = false;
  profile: QmUser | null = null;

  types = [
    { value: 'length'      as MeasurementType, label: 'Len' },
    { value: 'weight'      as MeasurementType, label: 'Wgt' },
    { value: 'volume'      as MeasurementType, label: 'Vol' },
    { value: 'temperature' as MeasurementType, label: 'Tmp' }
  ];

  constructor(
    public auth:  AuthService,
    public modal: AuthModalService,
    public state: ConverterStateService,
    public theme: ThemeService,
    private router: Router
  ) {
    this.title$ = this.state.op$.pipe(map(op => OP_TITLES[op] || ''));
  }

  async toggleProfile(): Promise<void> {
    if (this.profileOpen) { this.profileOpen = false; return; }
    this.profileOpen   = true;
    this.profileLoading = true;
    this.profile = await this.auth.getMe();
    this.profileLoading = false;
  }

  closeProfile(e: Event): void {
    e.stopPropagation();
    this.profileOpen = false;
  }

  setType(t: MeasurementType): void {
    this.state.setType(t);
    this.router.navigate(['/']);
  }
}
