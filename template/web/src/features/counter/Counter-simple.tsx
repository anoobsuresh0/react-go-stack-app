import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { getCounter, incrementCounter, decrementCounter, type Counter as CounterType } from './api'

export function Counter() {
  const [counter, setCounter] = useState<CounterType | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadCounter()
  }, [])

  async function loadCounter() {
    try {
      setLoading(true)
      const data = await getCounter()
      setCounter(data)
    } catch {
      toast.error('Failed to load counter')
    } finally {
      setLoading(false)
    }
  }

  async function handleIncrement() {
    try {
      setUpdating(true)
      const data = await incrementCounter()
      setCounter(data)
    } catch {
      toast.error('Failed to increment counter')
    } finally {
      setUpdating(false)
    }
  }

  async function handleDecrement() {
    try {
      setUpdating(true)
      const data = await decrementCounter()
      setCounter(data)
    } catch {
      toast.error('Failed to decrement counter')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Counter</CardTitle>
        <CardDescription>A simple counter backed by PostgreSQL</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleDecrement}
            disabled={updating}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-4xl font-bold tabular-nums min-w-[80px] text-center">
            {counter?.value ?? 0}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleIncrement}
            disabled={updating}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4 flex justify-center">
          <Button variant="ghost" size="sm" onClick={loadCounter} disabled={updating}>
            <RotateCcw className="mr-2 h-3 w-3" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
