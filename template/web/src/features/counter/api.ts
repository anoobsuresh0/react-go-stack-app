import { apiClient } from '@/lib/api/client'

export interface Counter {
  id: string
  value: number
  created_at: string
  updated_at: string
}

export async function getCounter(): Promise<Counter> {
  const response = await apiClient.get<Counter>('/counter')
  return response.data
}

export async function incrementCounter(): Promise<Counter> {
  const response = await apiClient.post<Counter>('/counter/increment')
  return response.data
}

export async function decrementCounter(): Promise<Counter> {
  const response = await apiClient.post<Counter>('/counter/decrement')
  return response.data
}
