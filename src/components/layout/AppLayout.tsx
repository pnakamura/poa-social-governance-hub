import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ChatAssistant } from '@/components/ChatAssistant'
import { MenuVisibilityProvider } from '@/hooks/useMenuVisibility'

export function AppLayout() {
  const location = useLocation()

  return (
    <MenuVisibilityProvider>
      <div className="flex h-screen bg-background bg-dot-grid overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Topbar />
          <main key={location.pathname} className="flex-1 overflow-y-auto p-6 animate-fade-in custom-scrollbar">
            <Outlet />
          </main>
        </div>
        <ChatAssistant />
      </div>
    </MenuVisibilityProvider>
  )
}
