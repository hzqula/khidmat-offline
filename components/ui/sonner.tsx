"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors={true}
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-green-600 dark:text-green-400" />
        ),
        info: <InfoIcon className="size-4 text-blue-600 dark:text-blue-400" />,
        warning: (
          <TriangleAlertIcon className="size-4 text-yellow-600 dark:text-yellow-400" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-red-600 dark:text-red-400" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-gray-600 dark:text-gray-400" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          success:
            "bg-green-50/90 border-green-200 text-green-950 dark:bg-green-950/70 dark:border-green-800 dark:text-green-100",
          error:
            "bg-red-50/90 border-red-200 text-red-950 dark:bg-red-950/70 dark:border-red-800 dark:text-red-100",
          warning:
            "bg-yellow-50/90 border-yellow-200 text-yellow-950 dark:bg-yellow-950/70 dark:border-yellow-800 dark:text-yellow-100",
          info: "bg-blue-50/90 border-blue-200 text-blue-950 dark:bg-blue-950/70 dark:border-blue-800 dark:text-blue-100",
          default: "bg-white dark:bg-gray-900 border-border text-foreground",
          loading:
            "bg-gray-50/90 border-gray-200 text-gray-950 dark:bg-gray-900/70 dark:border-gray-800 dark:text-gray-100",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
