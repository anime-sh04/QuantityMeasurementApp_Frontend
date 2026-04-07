import { Component } from '@angular/core';
import { AsyncPipe, NgClass, NgFor } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgClass],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let t of toastService.toasts$ | async"
        class="toast"
        [ngClass]="t.type">
        <span [style.color]="t.type === 'success' ? 'var(--success)' : 'var(--error)'">
          {{ t.type === 'success' ? '✓' : '⚠' }}
        </span>
        {{ t.message }}
      </div>
    </div>
  `
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}
