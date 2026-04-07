import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopbarComponent } from './layout/topbar/topbar.component';
import { AuthModalComponent } from './auth/auth-modal/auth-modal.component';
import { ToastComponent } from './shared/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, AuthModalComponent, ToastComponent],
  styles: [`:host { display: flex; width: 100%; height: 100vh; overflow: hidden; }`],
  template: `
    <app-sidebar></app-sidebar>
    <main class="main">
      <app-topbar></app-topbar>
      <router-outlet></router-outlet>
    </main>
    <app-auth-modal></app-auth-modal>
    <app-toast></app-toast>
  `
})
export class AppComponent {}
