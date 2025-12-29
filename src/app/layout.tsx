import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "AI Vision - Next Gen AI Video Platform",
    template: "%s | AI Vision"
  },
  description: "Create, share and discover amazing AI-generated videos. The best platform for AI video creators and enthusiasts.",
  keywords: ["AI video", "Sora", "Runway", "Midjourney", "Video Generation", "AI Art"],
  authors: [{ name: "AI Vision Team" }],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://ai-vision.vercel.app",
    title: "AI Vision - Next Gen AI Video Platform",
    description: "Discover the future of video creation with AI Vision.",
    siteName: "AI Vision",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Vision",
    description: "Create, share and discover amazing AI-generated videos.",
  }
};

import { GlobalErrorListener } from "@/hooks/useErrorHandler";

// ... existing imports

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <GlobalErrorListener />
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
