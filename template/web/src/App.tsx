import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Counter } from '@/features/counter/Counter'

export default function App() {
  return (
    <ErrorBoundary>
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h1 className="text-lg font-semibold">{{APP_TITLE}}</h1>
        </header>
        <main className="flex flex-1 items-center justify-center p-6">
          <Counter />
        </main>
      </div>
    </ErrorBoundary>
  )
}
