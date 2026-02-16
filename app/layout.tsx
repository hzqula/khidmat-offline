import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import QueryProvider from "@/components/providers/query-provider";

const sourceSans = localFont({
  src: [
    {
      path: "../public/fonts/sans/SourceSans3-VariableFont_wght.ttf",
      style: "normal",
      weight: "200 900",
    },
    {
      path: "../public/fonts/sans/SourceSans3-Italic-VariableFont_wght.ttf",
      style: "italic",
      weight: "200 900",
    },
  ],
  variable: "--font-source-sans",
  weight: "200 900",
});

const sourceSerif = localFont({
  src: [
    {
      path: "../public/fonts/serif/SourceSerif4-VariableFont_opsz,wght.ttf",
      style: "normal",
      weight: "200 900",
    },
    {
      path: "../public/fonts/serif/SourceSerif4-Italic-VariableFont_opsz,wght.ttf",
      style: "italic",
      weight: "200 900",
    },
  ],
  variable: "--font-source-serif",
  weight: "200 900",
});

const khadijah = localFont({
  src: [
    {
      path: "../public/fonts/headline/Khodijah Free.ttf",
      style: "normal",
    },
  ],
  variable: "--font-khadijah",
  weight: "200 900",
});

export const metadata: Metadata = {
  title: "Khidmat | Sistem Informasi Masjid",
  description:
    "Sistem Informasi Masjid untuk manajemen kegiatan, donasi, inventaris, dan pelaporan secara efisien dan transparan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sourceSans.variable} ${khadijah.variable} ${sourceSerif.variable} antialiased`}
      >
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
