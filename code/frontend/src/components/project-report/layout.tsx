import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css"
import { UserProvider } from "@/app/context/userProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Project Tracking System - Report",
  description: "Generate report",
};

export default function RootLayout({ children, }: Readonly<{ children: React.ReactNode; }>) {
  return (

    <html lang="en">
      <body>
          <UserProvider>
            <div id="modal-root" />
            {children}
          </UserProvider>
      </body>
    </html>

  );
}
