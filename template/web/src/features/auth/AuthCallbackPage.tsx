import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      localStorage.setItem('token', token)
      navigate('/', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [navigate, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <Skeleton className="h-8 w-48 mx-auto" />
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  )
}
