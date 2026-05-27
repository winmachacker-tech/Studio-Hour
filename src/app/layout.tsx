import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Cormorant_Garamond, Fraunces } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const bricolage = localFont({
  src: [
    { path: "../../public/fonts/BricolageGrotesque-Light.ttf", weight: "300" },
    { path: "../../public/fonts/BricolageGrotesque-Regular.ttf", weight: "400" },
    { path: "../../public/fonts/BricolageGrotesque-Medium.ttf", weight: "500" },
    { path: "../../public/fonts/BricolageGrotesque-SemiBold.ttf", weight: "600" },
    { path: "../../public/fonts/BricolageGrotesque-Bold.ttf", weight: "700" },
  ],
  variable: "--font-bricolage",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Studio Hour",
  description: "A private studio companion for Danielle.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Studio Hour",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#130D1A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${cormorant.variable} ${fraunces.variable}`}
    >
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
