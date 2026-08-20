import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "۲۲ درجه — سؤال شغلی‌ات را از کسی بپرس که همان کار را می‌کنه",
  description:
    "برای انتخاب مسیر شغلی، تغییر حوزه، مهاجرت کاری یا آمادگی مصاحبه، ۲۲ دقیقه رایگان با متخصصی حرف بزن که همین حالا سرِ همان کاره.",
};

export const viewport: Viewport = {
  themeColor: "#141110",
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
