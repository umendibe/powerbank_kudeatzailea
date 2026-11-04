import { HttpInterceptorFn } from '@angular/common/http';

const SESSION_KEY = 'administrazio_admin_session';

function readToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as { token?: string }).token ?? null;
  } catch {
    return null;
  }
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = readToken();
  if (!token || !request.url.includes('/alokaziosistema/')) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
