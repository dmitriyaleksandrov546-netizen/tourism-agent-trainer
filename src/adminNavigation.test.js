import { describe, expect, it } from 'vitest';
import { pathForView, viewFromPath } from './adminNavigation.js';

describe('admin navigation', () => {
  it('opens admin dashboard on /admin', () => {
    expect(viewFromPath('/admin')).toBe('admin');
    expect(viewFromPath('/admin/')).toBe('admin');
  });

  it('keeps trainer as default route', () => {
    expect(viewFromPath('/')).toBe('trainer');
    expect(viewFromPath('/anything-else')).toBe('trainer');
  });

  it('opens account administration on /accounts', () => {
    expect(viewFromPath('/accounts')).toBe('accounts');
    expect(viewFromPath('/accounts/')).toBe('accounts');
  });

  it('builds public paths for views', () => {
    expect(pathForView('admin')).toBe('/admin');
    expect(pathForView('accounts')).toBe('/accounts');
    expect(pathForView('trainer')).toBe('/');
  });
});
