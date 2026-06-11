import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smart Parking Dashboard — Garis Awan",
  description:
    "Dashboard monitoring real-time untuk sistem parkir pintar berbasis Computer Vision dan IoT. Pantau 6 slot parkir secara langsung melalui ESP32-CAM dan MQTT.",
  keywords: ["smart parking", "IoT", "computer vision", "ESP32", "MQTT", "dashboard"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#08090d] text-zinc-100">
        {children}
      </body>
    </html>
  );
}
