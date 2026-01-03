import { Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'

export function Layout() {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
