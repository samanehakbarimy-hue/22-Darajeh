import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "۲۲ درجه — تماس رایگان ۲۲ دقیقه‌ای با یک متخصص",
  description:
    "یک تماس رایگان ۲۲ دقیقه‌ای با یک متخصص رزرو کن. بدون هزینه، بدون تعهد — فقط یک گفتگو.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
