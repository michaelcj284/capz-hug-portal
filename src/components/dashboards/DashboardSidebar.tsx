import { LucideIcon } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface NavItem {
  title: string;
  value: string;
  icon: LucideIcon;
}

interface DashboardSidebarProps {
  title: string;
  userName?: string;
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (value: string) => void;
  onSignOut: () => void;
}

const DashboardSidebar = ({
  title,
  userName,
  navItems,
  activeTab,
  onTabChange,
  onSignOut,
}: DashboardSidebarProps) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <img
            src="/lovable-uploads/fbe5d1f1-a35b-47a7-8c54-80c47f04a9e1.png"
            alt="WEBCAPZ Logo"
            className="h-8 w-auto"
          />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{title}</span>
              {userName && (
                <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                  {userName}
                </span>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.value)}
                    isActive={activeTab === item.value}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button
          variant="outline"
          onClick={onSignOut}
          className="w-full justify-start"
          size={isCollapsed ? 'icon' : 'default'}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
