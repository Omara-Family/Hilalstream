import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { AdminGuard } from './AdminGuard';

export const AdminLayout = () => {
  return (
    <AdminGuard>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <main className="flex-1 flex flex-col">
            <header className="h-14 flex items-center border-b border-border px-4 bg-card">
              <SidebarTrigger />
              <h1 className="ml-4 text-lg font-semibold text-foreground">HilalStream Admin</h1>
            </header>
            <div className="flex-1 p-6 overflow-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </SidebarProvider>
    </AdminGuard>
  );
};
