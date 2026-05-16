import { Cormorant_Garamond, Jost } from "next/font/google";
import "./eoi-theme.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-jost",
  display: "swap",
});

export default function EoiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`eoi-shell ${cormorant.variable} ${jost.variable} min-h-screen bg-[#faf6ef] font-[family-name:var(--font-jost)]`}
    >
      {children}
    </div>
  );
}
