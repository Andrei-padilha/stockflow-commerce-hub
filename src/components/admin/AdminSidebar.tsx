import { Package, ShoppingCart, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface AdminSidebarProps {
  activeSection: "products" | "orders" | "stock";
  onSectionChange: (section: "products" | "orders" | "stock") => void;
}


export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  const { t } = useTranslation();

  const menuItems = [
    {
      title: t('admin.products'),
      icon: Package,
      section: "products" as const,
    },
    {
      title: t('admin.orders'),
      icon: ShoppingCart,
      section: "orders" as const,
    },
    {
      title: t('admin.stockAlerts'),
      icon: AlertTriangle,
      section: "stock" as const,
    },
  ];

  return (
    <Sidebar className="w-64">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>StockFlow Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.section}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.section)}
                    isActive={activeSection === item.section}
                    className="w-full justify-start"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}