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

// Being reachable and being in Google are separate decisions, so they are
// separate switches. The doors can stand open to anyone holding the link while
// search results stay empty. Unset means not indexed: the safe way round, so
// forgetting a variable cannot put the site in front of strangers.
const ALLOW_INDEXING = process.env.ALLOW_INDEXING === "true";

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
  // This is what actually keeps the site out of search results. robots.txt
  // deliberately lets crawlers in so they can read this tag; turning them away
  // there would mean they never see it. Only a request either way -- the proxy
  // is what holds the door.
  ...(ALLOW_INDEXING
    ? {}
    : { robots: { index: false, follow: false, nocache: true } }),
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
