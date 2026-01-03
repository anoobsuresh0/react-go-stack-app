import { apiClient } from '@/lib/api/client';

export interface Counter {
  id: number;
  value: number;
}

export async function getCounter(): Promise<Counter> {
  const response = await apiClient.get<Counter>('/api/counter');
  return response.data;
}

export async function incrementCounter(): Promise<Counter> {
  const response = await apiClient.post<Counter>('/api/counter/increment');
  return response.data;
}

export async function decrementCounter(): Promise<Counter> {
  const response = await apiClient.post<Counter>('/api/counter/decrement');
  return response.data;
}
