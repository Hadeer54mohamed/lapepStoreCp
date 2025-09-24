import "material-symbols";
import "remixicon/fonts/remixicon.css";
import "react-calendar/dist/Calendar.css";
import "swiper/css";
import "swiper/css/bundle";

// globals
import "./globals.css";

import type { Metadata } from "next";
import { Cairo } from "next/font/google";

import QueryProvider from "@/providers/QueryProvider";

import { Toaster } from "react-hot-toast";

const cairo = Cairo({
  variable: "--font-body",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "ENS - CMS",
  description: "CMS for ENS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} antialiased`}>
        <QueryProvider>{children}</QueryProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
