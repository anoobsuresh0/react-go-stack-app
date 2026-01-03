import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCounter, incrementCounter, decrementCounter, type Counter as CounterType } from './api';
import { toast } from 'sonner';
import { Minus, Plus, RefreshCw } from 'lucide-react';

export function Counter() {
  const [counter, setCounter] = useState<CounterType | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchCounter = async () => {
    try {
      const data = await getCounter();
      setCounter(data);
    } catch (error) {
      toast.error('Failed to fetch counter');
      console.error('Error fetching counter:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounter();
  }, []);

  const handleIncrement = async () => {
    setUpdating(true);
    try {
      const data = await incrementCounter();
      setCounter(data);
    } catch (error) {
      toast.error('Failed to increment counter');
      console.error('Error incrementing counter:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDecrement = async () => {
    setUpdating(true);
    try {
      const data = await decrementCounter();
      setCounter(data);
    } catch (error) {
      toast.error('Failed to decrement counter');
      console.error('Error decrementing counter:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Counter</h1>
        <p className="text-muted-foreground">
          A simple counter example demonstrating React + Go + PostgreSQL integration.
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Counter Value</CardTitle>
          <CardDescription>
            Click the buttons to increment or decrement the counter.
            The value is persisted in the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              disabled={updating}
              className="h-12 w-12"
            >
              <Minus className="h-6 w-6" />
            </Button>

            <div className="text-6xl font-bold tabular-nums min-w-24 text-center">
              {counter?.value ?? 0}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              disabled={updating}
              className="h-12 w-12"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
