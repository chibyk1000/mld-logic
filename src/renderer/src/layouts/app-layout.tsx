import { AppSidebar } from '@renderer/components/app-sidebar'

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@renderer/components/ui/sidebar'
import { Outlet } from 'react-router-dom'

export default function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-white">
        <header className="h-16 border-b border-border bg-card flex items-center px-6 sticky top-0 z-10">
          <SidebarTrigger className="mr-4" />
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4  bg-accent/3 ">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
