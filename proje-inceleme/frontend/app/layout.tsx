import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../context/CartContext";
import { AuthProvider } from "../context/AuthContext";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import EmailVerificationNotice from "../components/EmailVerificationNotice";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://medinehuzur.com"),
  title: {
    default: "Medine Huzur | İslami Tesettür, Hediyelik ve Hac Malzemeleri",
    template: "%s | Medine Huzur",
  },
  description:
    "Medine Huzur; İslami tesettür, hediyelik ve hac malzemelerini güvenilir ve modern bir alışveriş yapısıyla sunar.",
  keywords: [
    "Medine Huzur",
    "seccade",
    "tesbih",
    "İslami ürünler",
    "hediyelik ürünler",
    "hac malzemeleri",
    "e-ticaret",
  ],
  applicationName: "Medine Huzur",
  authors: [{ name: "Medine Huzur" }],
  creator: "Medine Huzur",
  publisher: "Medine Huzur",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Medine Huzur | İslami Tesettür, Hediyelik ve Hac Malzemeleri",
    description:
      "İslami tesettür, hediyelik ve hac malzemelerini Medine Huzur güvencesiyle keşfedin.",
    url: "https://medinehuzur.com",
    siteName: "Medine Huzur",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Medine Huzur | İslami Tesettür, Hediyelik ve Hac Malzemeleri",
    description:
      "İslami tesettür, hediyelik ve hac malzemelerini Medine Huzur güvencesiyle keşfedin.",
  },
  alternates: {
    canonical: "/",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
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