import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AuthForm = 'login' | 'register';

@Injectable({ providedIn: 'root' })
export class AuthModalService {
  private _open = new BehaviorSubject<boolean>(false);
  private _form = new BehaviorSubject<AuthForm>('login');

  open$  = this._open.asObservable();
  form$  = this._form.asObservable();

  get isOpen(): boolean  { return this._open.value; }
  get form():   AuthForm { return this._form.value; }

  open(form: AuthForm = 'login'): void {
    this._form.next(form);
    this._open.next(true);
  }

  close(): void { this._open.next(false); }

  switchForm(form: AuthForm): void { this._form.next(form); }
}
