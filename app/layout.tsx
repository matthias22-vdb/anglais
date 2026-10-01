import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ENGLISH POCKET EXAM",
  description: "Entraînement en anglais et suivi pédagogique des étudiants.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
