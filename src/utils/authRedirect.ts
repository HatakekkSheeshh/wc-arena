const allowedAuthRedirectPaths = new Set(['/login', '/reset-password']);

export function getAuthRedirectUrl(path = '/login') {
  const nextPath = allowedAuthRedirectPaths.has(path) ? path : '/login';
  return `${window.location.origin}${nextPath}`;
}
