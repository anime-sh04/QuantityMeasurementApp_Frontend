import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id:      number;
  message: string;
  type:    'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = new BehaviorSubject<Toast[]>([]);
  toasts$ = this._toasts.asObservable();
  private nextId = 0;

  show(message: string, type: 'success' | 'error' = 'success'): void {
    const toast: Toast = { id: this.nextId++, message, type };
    this._toasts.next([...this._toasts.value, toast]);
    setTimeout(() => this.remove(toast.id), 3500);
  }

  remove(id: number): void {
    this._toasts.next(this._toasts.value.filter(t => t.id !== id));
  }
}
