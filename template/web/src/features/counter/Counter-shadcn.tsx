import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { getCounter, incrementCounter, decrementCounter, type Counter as CounterType } from './api'

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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Counter</CardTitle>
        <CardDescription>
          Stored in PostgreSQL — restart anything and the value survives.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-6 py-4">
          <Button
            variant="outline"
            size="icon"
            aria-label="Decrement"
            onClick={() => run(decrementCounter)}
            disabled={busy || counter === null}
          >
            <Minus />
          </Button>
          <span className="min-w-24 text-center text-5xl font-bold tabular-nums">
            {counter?.value ?? '–'}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Increment"
            onClick={() => run(incrementCounter)}
            disabled={busy || counter === null}
          >
            <Plus />
          </Button>
        </div>
        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}
        <div className="mt-2 flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => run(getCounter)} disabled={busy}>
            <RotateCcw />
            Refresh
          </Button>
        </div>
        {counter && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Last updated {new Date(counter.updated_at).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
