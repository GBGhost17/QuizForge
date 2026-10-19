import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from './HomePage';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderPage() {
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <HomePage />
    </QueryClientProvider>,
  );
}

describe('HomePage', () => {
  it('shows the scaffold heading and the API status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            status: 'ok',
            service: 'quizforge-api',
            version: '0.0.0',
            timestamp: '2026-01-01T00:00:00.000Z',
          }),
      }),
    );
    renderPage();
    expect(screen.getByRole('heading', { name: /scaffold is ready/i })).toBeTruthy();
    expect(await screen.findByText('API: ok')).toBeTruthy();
  });

  it('shows an error state when the API is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    renderPage();
    expect(await screen.findByText(/API: unreachable/)).toBeTruthy();
  });
});
