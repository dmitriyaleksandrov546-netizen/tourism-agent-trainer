export function viewFromPath(pathname = '/') {
  const normalizedPath = String(pathname).replace(/\/$/, '');
  if (normalizedPath === '/admin') return 'admin';
  if (normalizedPath === '/accounts') return 'accounts';
  return 'trainer';
}

export function pathForView(view = 'trainer') {
  if (view === 'admin') return '/admin';
  if (view === 'accounts') return '/accounts';
  return '/';
}
