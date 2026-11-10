import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ClientGate } from "@/components/ClientGate";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "Tally",
  description: "Speak your sales. Tally keeps the book.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F6B4A",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
      <body className="min-h-dvh bg-ground font-sans text-ink">
        <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pb-7 pt-6">
          <ClientGate>{children}</ClientGate>
        </main>
      </body>
    </html>
  );
}
