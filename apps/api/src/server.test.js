import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './server.js';

describe('API', () => {
  it('health works', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('serves local knowledge without MongoDB', async () => {
    const response = await request(app).get('/api/knowledge?q=fever');
    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it('accepts an assessment sync operation idempotently', async () => {
    const payload = {
      id: 'sync-test-1',
      deviceId: 'device-test',
      entityType: 'assessment',
      entityId: 'assessment-test-1',
      operation: 'UPSERT',
      payload: { symptoms: 'mild fever', severity: 1, durationDays: 1 },
    };
    const first = await request(app).post('/api/sync').send(payload);
    const second = await request(app).post('/api/sync').send(payload);
    expect(first.status).toBe(200);
    expect(first.body.duplicate).toBe(false);
    expect(second.body.duplicate).toBe(true);
  });
});