import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Administrazio ataleko edozein bidek saioa hasita egotea eskatzen du.
export const adminAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

// Erabiltzaileak eta udalerriak soilik administratzaile orokorrak kudea ditzake.
export const systemAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isSystemAdmin()) {
    return true;
  }

  if (auth.isLoggedIn()) {
    return router.createUrlTree(['/kargaguneak']);
  }

  return router.createUrlTree(['/login']);
};

// Administratzaileak saioa hasita badu, ez da login pantailara itzuliko.
export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree([
    auth.isSystemAdmin() ? '/erabiltzaileak' : '/kargaguneak',
  ]);
};
