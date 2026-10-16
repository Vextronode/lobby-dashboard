import { describe, expect, it } from 'vitest';
import { createApp } from '../src/http/app';

describe('GET /healthz', () => {
  it('AC-2: returns 200 {"ok":true}', async () => {
    const response = await createApp().request('/healthz');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
