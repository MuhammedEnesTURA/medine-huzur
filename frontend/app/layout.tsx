import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

import { CartProvider } from "../context/CartContext";
import { AuthProvider } from "../context/AuthContext";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import EmailVerificationNotice from "../components/EmailVerificationNotice";
import { absoluteUrl, siteConfig } from "../lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Medine Huzur | İslami Hediyelik, Seccade ve Tesbih",
    template: "%s | Medine Huzur",
  },
  description: siteConfig.description,
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  applicationName: "Medine Huzur",
  authors: [{ name: "Medine Huzur" }],
  creator: "Medine Huzur",
  publisher: "Medine Huzur",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Medine Huzur | İslami Hediyelik, Seccade ve Tesbih",
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "tr_TR",
    type: "website",
    images: [
      {
        url: absoluteUrl(siteConfig.ogImage),
        alt: "Medine Huzur",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Medine Huzur | İslami Hediyelik, Seccade ve Tesbih",
    description: siteConfig.description,
    images: [absoluteUrl(siteConfig.ogImage)],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <CartProvider>
            <SiteHeader />

            <div className="min-h-screen flex flex-col pt-[86px] sm:pt-[88px] lg:pt-[88px] xl:pt-[88px]">
              <EmailVerificationNotice />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
