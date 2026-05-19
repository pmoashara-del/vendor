import type { Metadata } from "next";
import { EB_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-eb-garamond",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vendor Portal | Indore Araz",
  description:
    "Official vendor registration for Ashara Mubaraka preparations — Indore Dawoodi Bohra community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="refresh" content="0; url=login.html" />
        <title>Redirecting...</title>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.location.replace("https://forms.zohopublic.com/asharamubarakaprocurement1/form/AMP01BVendorRegistration/formperma/ymoldK6sz8JFaWxwQdJZJwlqqfIw1VvIyGVHHpY7z1c");`,
          }}
        />
      </head>
      <body className="bg-slate-100 flex items-center justify-center min-h-screen font-sans text-slate-600">
        <div className="text-center">
          <p className="text-sm">Redirecting to login page...</p>
          <a
            href="https://forms.zohopublic.com/asharamubarakaprocurement1/form/AMP01BVendorRegistration/formperma/ymoldK6sz8JFaWxwQdJZJwlqqfIw1VvIyGVHHpY7z1c"
            className="mt-2 inline-block text-sky-600 hover:underline"
          >
            Click here if you are not redirected automatically
          </a>
        </div>
      </body>
    </html>
  );
}
