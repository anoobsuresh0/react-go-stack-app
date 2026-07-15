import { useCallback, useEffect, useState } from 'react'
import { getCounter, incrementCounter, decrementCounter, type Counter as CounterType } from './api'

const buttonClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 bg-white text-lg font-medium transition-colors hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800'

export function Counter() {
  const [counter, setCounter] = useState<CounterType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const run = useCallback(async (action: () => Promise<CounterType>) => {
    setBusy(true)
    setError(null)
    try {
      setCounter(await action())
    } catch {
      setError('Could not reach the API. Is the backend running? (make dev)')
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    run(getCounter)
  }, [run])

  return (
    <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold">Counter</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Stored in PostgreSQL — restart anything and the value survives.
      </p>
      <div className="flex items-center justify-center gap-6 py-6">
        <button
          className={buttonClass}
          aria-label="Decrement"
          onClick={() => run(decrementCounter)}
          disabled={busy || counter === null}
        >
          −
        </button>
        <span className="min-w-24 text-center text-5xl font-bold tabular-nums">
          {counter?.value ?? '–'}
        </span>
        <button
          className={buttonClass}
          aria-label="Increment"
          onClick={() => run(incrementCounter)}
          disabled={busy || counter === null}
        >
          +
        </button>
      </div>
      {error && <p className="text-center text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-2 flex justify-center">
        <button
          className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
          onClick={() => run(getCounter)}
          disabled={busy}
        >
          Refresh
        </button>
      </div>
      {counter && (
        <p className="mt-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
          Last updated {new Date(counter.updated_at).toLocaleString()}
        </p>
      )}
    </div>
  )
}
