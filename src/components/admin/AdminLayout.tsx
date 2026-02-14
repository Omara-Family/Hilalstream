import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { AdminGuard } from './AdminGuard';

export const AdminLayout = () => {
  const { t } = useTranslation();
  return (
    <AdminGuard>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <main className="flex-1 flex flex-col">
            <header className="h-14 flex items-center border-b border-border px-4 bg-card">
              <SidebarTrigger />
              <h1 className="ms-4 text-lg font-semibold text-foreground">HilalStream {t('admin.panelTitle')}</h1>
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
