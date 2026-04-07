import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { ConverterStateService, MeasurementType } from '../../core/services/converter-state.service';
import { AuthModalService } from '../../auth/auth-modal/auth-modal.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-text">QM</span>
        <span class="logo-sub">Quantity Measurement</span>
      </div>

      <nav class="sidebar-nav">
        <span class="nav-label">Pages</span>

        <button class="nav-item"
          routerLink="/"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }">
          <span class="nav-icon">⇄</span> Converter
        </button>

        <button class="nav-item"
          routerLink="/history"
          routerLinkActive="active">
          <span class="nav-icon">◷</span> History
        </button>

        <span class="nav-label">Measurement</span>

        <button *ngFor="let t of types"
          class="type-nav-item"
          [ngClass]="{ active: (state.type$ | async) === t.value }"
          (click)="setType(t.value)">
          <span class="type-dot" [ngClass]="'dot-' + t.value"></span>
          {{ t.label }}
        </button>
      </nav>

      <div class="sidebar-bottom">
        <button class="theme-btn" (click)="theme.toggle()">
          <span>{{ theme.icon }}</span>
          <span>{{ theme.label }}</span>
        </button>

        <ng-container *ngIf="auth.user$ | async as user; else loggedOut">
          <button class="btn btn-ghost btn-sm"
            style="width:100%;justify-content:center;"
            (click)="auth.logout()">
            Logout
          </button>
        </ng-container>

        <ng-template #loggedOut>
          <button class="btn btn-primary btn-sm"
            style="width:100%;justify-content:center;"
            (click)="modal.open('login')">
            Login
          </button>
        </ng-template>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  types = [
    { value: 'length'      as MeasurementType, label: 'Length' },
    { value: 'weight'      as MeasurementType, label: 'Weight' },
    { value: 'volume'      as MeasurementType, label: 'Volume' },
    { value: 'temperature' as MeasurementType, label: 'Temperature' }
  ];

  constructor(
    public theme: ThemeService,
    public auth:  AuthService,
    public state: ConverterStateService,
    public modal: AuthModalService,
    private router: Router
  ) {}

  setType(t: MeasurementType): void {
    this.state.setType(t);
    // Navigate to converter when a type is selected
    this.router.navigate(['/']);
  }
}
