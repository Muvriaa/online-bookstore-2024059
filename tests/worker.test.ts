import { describe, expect, it } from 'vitest';
import { exports } from 'cloudflare:workers';

describe('Week 15 starter Worker', () => {
  it('GET /api/health returns starter health status', async () => {
    const response = await exports.default.fetch('https://example.test/api/health');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: 'ok',
      service: 'online-bookstore',
      phase: 'starter',
    });
  });

  it('has not implemented the catalog API yet', async () => {
    const response = await exports.default.fetch('https://example.test/api/books');
    expect(response.status).toBe(404);
  });
});
