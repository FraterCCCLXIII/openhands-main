export const normalizePathname = (pathname: string) => {
  if (!pathname || pathname === '/') return '/';

  return pathname.replace(/\/+$/, '') || '/';
};

export const isPathActive = (pathname: string, target: string) => {
  return normalizePathname(pathname) === normalizePathname(target);
};
