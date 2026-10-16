export type Route = 'tv' | 'mobile';

/** `/tv` (and anything below it) is the TV screen; every other path is the mobile page (default B22). */
export function routeFor(pathname: string): Route {
  return pathname === '/tv' || pathname.startsWith('/tv/') ? 'tv' : 'mobile';
}
