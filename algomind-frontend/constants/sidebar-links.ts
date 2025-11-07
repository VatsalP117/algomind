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
export const sidebarItems = [
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
