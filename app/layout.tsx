import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
});

const IS_PRIVATE = process.env.SITE_PRIVATE === "true";

export const metadata: Metadata = {
  // The public title is the pitch, and login, privacy and terms have to stay
  // open for people to sign in and for Google to verify the OAuth app. Leaving
  // the tagline in the tab of those pages hands the idea to anyone who looks,
  // which is the one thing the curtain is for.
  title: IS_PRIVATE
    ? "۲۲ درجه"
    : "۲۲ درجه — سؤال شغلی‌ات را از کسی بپرس که همان کار را می‌کنه",
  description: IS_PRIVATE
    ? undefined
    : "برای انتخاب مسیر شغلی، تغییر حوزه، مهاجرت کاری یا آمادگی مصاحبه، ۲۲ دقیقه رایگان با کارشناسی حرف بزن که همین حالا سرِ همان کاره.",
  // Belt as well as braces: robots.txt asks crawlers not to look, this asks
  // them not to keep what they already saw. Both go away when SITE_PRIVATE
  // does, and both are only requests — the proxy is what actually holds the
  // door.
  ...(IS_PRIVATE
    ? { robots: { index: false, follow: false, nocache: true } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#0f1818",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
