import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Gauche ou Droite",
  description:
    "Un jeu humoristique et absurde : un mot, une carte, gauche ou droite ?",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gauche ou Droite",
  },
};

export const viewport: Viewport = {
  themeColor: "#e63946",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
        />
      </head>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
