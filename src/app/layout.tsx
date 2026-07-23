import type { Metadata } from "next";
import { AppProvider } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: "TogetherFrame — Miles Apart, One Cute Moment Together",
  description:
    "A cute virtual photobooth and digital memory scrapbook for long-distance couples. Capture sweet moments together, even when you're far apart.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
