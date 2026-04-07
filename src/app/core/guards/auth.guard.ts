import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.loggedIn) return true;

  // Redirect to converter; the history component shows its own gate UI too
  router.navigate(['/']);
  return false;
};
