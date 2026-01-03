import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SITE_CONFIG } from "@/lib/constants";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { FloatingToolbar } from "@/components/layout/FloatingToolbar";
import { FooterWrapper } from "@/components/layout/FooterWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: SITE_CONFIG.name,
    template: `%s | ${SITE_CONFIG.name}`
  },
  description: SITE_CONFIG.description,
  keywords: ["AI video", "Sora", "Runway", "Midjourney", "Video Generation", "AI Art"],
  authors: [{ name: "AI Vision Team" }],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE_CONFIG.url,
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    siteName: SITE_CONFIG.name,
    images: [
        {
            url: SITE_CONFIG.ogImage,
            width: 1200,
            height: 630,
            alt: SITE_CONFIG.name,
        }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    images: [SITE_CONFIG.ogImage],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <div className="flex-1">
                {children}
              </div>
              <FooterWrapper />
            </div>
            <FloatingToolbar />
          </AuthProvider>
          <Toaster position="top-center" richColors closeButton theme="system" />
        </ThemeProvider>
      </body>
    </html>
  );
}
