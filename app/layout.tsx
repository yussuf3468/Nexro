import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "Nexro — Secure File Sharing",
    template: "%s | Nexro",
  },
  description:
    "Share files securely with end-to-end encryption. Files are encrypted in your browser before upload — nobody else can read them.",
  keywords: [
    "secure file sharing",
    "encrypted file transfer",
    "E2EE",
    "private file sharing",
    "AES-256",
  ],
  manifest: "/manifest.json",
  icons: [
    { rel: "icon", url: "/icons/icon-192.png", sizes: "192x192" },
    { rel: "apple-touch-icon", url: "/icons/icon-192.png" },
  ],
  openGraph: {
    title: "Nexro — Secure File Sharing",
    description:
      "Share files with end-to-end encryption. Zero knowledge. No account required.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        {/* Register service worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
