export interface Counter {
  value: number
  updated_at: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, init)
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  return response.json() as Promise<T>
}

export function getCounter(): Promise<Counter> {
  return request<Counter>('/counter')
}

export function incrementCounter(): Promise<Counter> {
  return request<Counter>('/counter/increment', { method: 'POST' })
}

export function decrementCounter(): Promise<Counter> {
  return request<Counter>('/counter/decrement', { method: 'POST' })
}
