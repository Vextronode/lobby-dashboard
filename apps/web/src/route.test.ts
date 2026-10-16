import { levelSchema } from '@lobby/contract';
import { assertNever } from '@lobby/core';
import { describe, expect, it } from 'vitest';
import { routeFor } from './route';

describe('routeFor', () => {
  it.each([
    ['/', 'mobile'],
    ['/tv', 'tv'],
    ['/tv/', 'tv'],
    ['/tvx', 'mobile'],
    ['/unknown', 'mobile'],
  ] as const)('%s → %s', (pathname, route) => {
    expect(routeFor(pathname)).toBe(route);
  });
});

describe('workspace packages', () => {
  it('AC-6: @lobby/contract and @lobby/core resolve by package name', () => {
    expect(levelSchema.options).toContain('UNKNOWN');
    expect(typeof assertNever).toBe('function');
  });
});
