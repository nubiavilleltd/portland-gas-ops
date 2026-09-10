import type { Metadata, Viewport } from "next";
import { Inter, Mulish } from "next/font/google";
import { Toaster } from "sonner";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const mulish = Mulish({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mulish",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Portland Gas Operations",
  description: "Internal ERP platform for Portland Gas Limited",
  applicationName: "Portland Gas Operations",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1C043B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} ${mulish.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-brand-bg antialiased" suppressHydrationWarning>
        <ServiceWorkerRegistration />
        <PWAInstallPrompt />
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          expand={false}
          visibleToasts={3}
          toastOptions={{ duration: 8000 }}
          className="print:hidden"
        />
      </body>
    </html>
  );
}
