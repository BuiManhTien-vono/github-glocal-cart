import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import NotificationToast from "@/components/NotificationToast";
import { Providers } from "@/components/Providers";
import ClientOnly from "@/components/ClientOnly";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GlocalCart | Trải Nghiệm Mua Sắm Đẳng Cấp",
  description: "Khám phá bộ sưu tập sản phẩm cao cấp toàn cầu tại GlocalCart.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${inter.className} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <Providers>
          <Header />
          <main className="flex-1 pt-24">
            {children}
          </main>
          <NotificationToast />
        </Providers>
      </body>
    </html>
  );
}
