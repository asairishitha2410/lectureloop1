import type { Metadata } from "next";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: "LectureLoop — AI Lecture-to-Learning Platform",
    template: "%s · LectureLoop",
  },
  description:
    "Turn every lecture into a learning system: source-linked notes, smart flashcards, quizzes and personalised revision schedules.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-page text-slate-700 antialiased">
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}