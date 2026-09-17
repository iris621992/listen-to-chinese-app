import type { Metadata } from "next";
import { Header } from "@/components/Header";
import "./globals.css";
import "./home-fidelity.css";

export const metadata: Metadata = {
  title: "YunChinese | Knowledge, Video & Practice",
  description: "A Chinese-learning platform that connects deep learner knowledge, contextual video, and focused practice.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
