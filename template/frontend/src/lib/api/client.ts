import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { config } from '@/lib/config'

// Create axios instance with default config
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: config.apiUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return instance
}

// Export singleton instance
export const apiClient = createAxiosInstance()

// Typed request helpers
export async function get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<{ data: T }> {
  return apiClient.get<T>(endpoint, config)
}

export async function post<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<{ data: T }> {
  return apiClient.post<T>(endpoint, data, config)
}

export async function put<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<{ data: T }> {
  return apiClient.put<T>(endpoint, data, config)
}

export async function del<T>(endpoint: string, config?: AxiosRequestConfig): Promise<{ data: T }> {
  return apiClient.delete<T>(endpoint, config)
}
