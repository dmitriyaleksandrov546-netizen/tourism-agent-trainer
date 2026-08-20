export function viewFromPath(pathname = '/') {
  return String(pathname).replace(/\/$/, '') === '/admin' ? 'admin' : 'trainer';
}

export function pathForView(view = 'trainer') {
  return view === 'admin' ? '/admin' : '/';
}
