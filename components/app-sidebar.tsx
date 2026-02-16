"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { User2 } from "lucide-react";
import Link from "next/link";
import { RiSettings2Line } from "react-icons/ri";
import { LuLayoutDashboard } from "react-icons/lu";

import { FaRegNewspaper } from "react-icons/fa6";
import { GoUpload } from "react-icons/go";
import { usePathname } from "next/navigation";

const AppSidebar = () => {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: <LuLayoutDashboard /> },
    {
      name: "Pengaturan",
      href: "/settings",
      icon: <RiSettings2Line />,
    },
    {
      name: "Unggah Gambar",
      href: "/images",
      icon: <GoUpload />,
    },
    {
      name: "Pengumuman",
      href: "/announcements",
      icon: <FaRegNewspaper />,
    },
  ];

  const isActive = links.find((link) => link.href === pathname);

  return (
    <Sidebar>
      <SidebarHeader className="px-8 h-16 border-b justify-center">
        <h1 className="font-display font-bold italic text-gold text-2xl">
          Khidmat
        </h1>
      </SidebarHeader>
      <SidebarContent className="py-4 border-b">
        {links.map((link) => {
          return (
            <Link
              className={`px-8 py-2 text-sm font-medium flex items-center gap-2 ${isActive?.href === link.href ? "text-grass border-r-4 border-r-grass bg-green-50" : "text-black"}`}
              key={link.href}
              href={link.href}
            >
              {link.icon}
              {link.name}
            </Link>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="px-8">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <User2 /> Username
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export { AppSidebar };
