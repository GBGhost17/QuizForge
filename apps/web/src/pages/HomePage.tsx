import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '@/lib/api';

export function HomePage() {
  const health = useQuery({ queryKey: ['health'], queryFn: fetchHealth, retry: false });

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:ring-2 focus:ring-neutral-900"
      >
        Skip to content
      </a>
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <span className="text-lg font-semibold">QuizForge</span>
          <span className="text-sm text-neutral-500">Scaffold · Stage S01</span>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold sm:text-3xl">QuizForge scaffold is ready</h1>
        <p className="mt-2 text-neutral-600">
          Responsive shell only. Product features arrive in later stages.
        </p>
        <section aria-labelledby="api-status" className="mt-6 rounded-lg border bg-white p-4">
          <h2 id="api-status" className="font-semibold">
            Backend status
          </h2>
          <p role="status" className="mt-1 text-sm">
            {health.isPending && 'Checking API…'}
            {health.isError && 'API: unreachable (start it with `pnpm dev`)'}
            {health.isSuccess && `API: ${health.data.status}`}
          </p>
        </section>
      </main>
    </div>
  );
}
