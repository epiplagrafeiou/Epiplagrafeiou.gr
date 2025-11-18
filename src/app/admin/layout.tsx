import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
       <main className="flex-grow">
        <SidebarProvider>
          <Sidebar>
            <AdminSidebar />
          </Sidebar>
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
       </main>
    </div>
  );
}
