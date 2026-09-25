import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Comptage dépôt", description: "Relevé de présence des articles en entrepôt", manifest: "/manifest.webmanifest" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, themeColor: "#102c46" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="fr"><body>{children}</body></html>; }
