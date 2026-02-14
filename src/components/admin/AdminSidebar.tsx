import { Film, Tv, Users, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation, Link } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const items = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Series', url: '/admin/series', icon: Tv },
  { title: 'Episodes', url: '/admin/episodes', icon: Film },
  { title: 'Users', url: '/admin/users', icon: Users },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-bold text-lg mb-2">
            {!collapsed && 'Admin Panel'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.url === '/admin'
                        ? location.pathname === '/admin'
                        : location.pathname.startsWith(item.url)
                    }
                  >
                    <NavLink to={item.url} end={item.url === '/admin'}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Site</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
