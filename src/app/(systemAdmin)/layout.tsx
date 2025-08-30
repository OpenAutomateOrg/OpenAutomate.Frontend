import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/sidebar/app-sidebar'
import { SiteHeader } from '@/components/layout/sidebar/site-header'
import { SearchProvider } from '@/components/layout/search/search-context'
import { ChatProvider } from '@/components/chat/chat-wrapper'
import { AdminRouteGuard } from '@/components/auth/admin-route-guard'
import { CommandPaletteProvider } from '@/providers/command-palette-provider'

export default function SystemAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminRouteGuard>
      <ChatProvider>
        <CommandPaletteProvider>
          <div className="[--header-height:calc(theme(spacing.14))]">
            <SidebarProvider className="flex flex-col">
              <SiteHeader />
              <div className="flex flex-1">
                <AppSidebar />
                <SidebarInset>
                  <SearchProvider>
                    <main className="">{children}</main>
                  </SearchProvider>
                </SidebarInset>
              </div>
            </SidebarProvider>
          </div>
        </CommandPaletteProvider>
      </ChatProvider>
    </AdminRouteGuard>
  )
}
