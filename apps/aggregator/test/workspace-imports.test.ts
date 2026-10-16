import { levelSchema } from '@lobby/contract';
import { assertNever } from '@lobby/core';
import { describe, expect, it } from 'vitest';

describe('workspace packages', () => {
  it('AC-6: @lobby/contract and @lobby/core resolve by package name', () => {
    expect(levelSchema.options).toContain('UNKNOWN');
    expect(typeof assertNever).toBe('function');
  });
});
