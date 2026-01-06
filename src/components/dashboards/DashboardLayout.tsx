import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { LucideIcon } from 'lucide-react';
import DashboardSidebar from './DashboardSidebar';

interface NavItem {
  title: string;
  value: string;
  icon: LucideIcon;
}

interface DashboardLayoutProps {
  title: string;
  userName?: string;
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (value: string) => void;
  onSignOut: () => void;
  children: ReactNode;
}

const DashboardLayout = ({
  title,
  userName,
  navItems,
  activeTab,
  onTabChange,
  onSignOut,
  children,
}: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar
          title={title}
          userName={userName}
          navItems={navItems}
          activeTab={activeTab}
          onTabChange={onTabChange}
          onSignOut={onSignOut}
        />
        <SidebarInset className="flex-1">
          <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
            <SidebarTrigger />
            <h1 className="font-semibold">{title}</h1>
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
