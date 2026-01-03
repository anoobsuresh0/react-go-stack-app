import { Link, useLocation } from 'react-router-dom'
import { Calculator } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  const location = useLocation()

  const navigation = [
    {
      name: 'Counter',
      href: '/counter',
      icon: Calculator,
    },
  ]

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">{{APP_ABBREVIATION}}</span>
          <span className="text-sm text-muted-foreground">{{APP_TITLE}}</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = location.pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          React + Go + PostgreSQL
        </div>
      </div>
    </div>
  )
}
