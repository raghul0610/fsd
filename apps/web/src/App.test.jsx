import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

vi.mock('./db/db', () => ({
  db: {},
  seedLocal: vi.fn(),
  getDeviceId: vi.fn().mockResolvedValue('test-device'),
}));
vi.mock('./services/sync', () => ({
  enqueue: vi.fn(),
  syncNow: vi.fn().mockResolvedValue({ synced: 0, failed: 0 }),
}));
vi.mock('./services/knowledge', () => ({ searchKnowledge: vi.fn().mockResolvedValue([]) }));
vi.mock('./services/api', () => ({ api: { knowledge: vi.fn(), facilities: vi.fn(), workers: vi.fn() } }));

describe('application shell', () => {
  it('renders the offline-first dashboard', () => {
    render(<App />);
    expect(screen.getByText('Healthcare, even when offline.')).toBeInTheDocument();
    expect(screen.getByText('Ask Health')).toBeInTheDocument();
    expect(screen.getByText('Check Symptoms')).toBeInTheDocument();
  });
});