import {
  Calendar,
  ChartBar,
  Inbox,
  Search,
  Settings,
  BookOpen,
  ClipboardPenLine,
  PencilLine,
  CheckCircle,
  BookOpenText,
} from "lucide-react";
import Link from "next/link";

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

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: ChartBar,
  },
  {
    title: "Review",
    url: "/review",
    icon: BookOpenText,
  },
  {
    title: "Add Problem",
    url: "/add-problem",
    icon: ClipboardPenLine,
  },
  {
    title: "Edit Concepts",
    url: "/edit-concepts",
    icon: PencilLine,
  },
  {
    title: "Library",
    url: "/library",
    icon: BookOpen,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
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
