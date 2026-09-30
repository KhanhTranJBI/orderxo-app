import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "700", "900"],
});

const dm = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  weight: ["300", "400", "500"],
});

export const metadata = {
  title: "OrderXO — Restaurant Owner Portal",
  description: "Manage your restaurant, online orders, locations, and subscription with OrderXO.",
  icons: {
    icon: "data:image/svg+xml,<svg viewBox='0 0 90 90' xmlns='http://www.w3.org/2000/svg'><defs><linearGradient id='b' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23EF9F27'/><stop offset='100%25' stop-color='%23D85A30'/></linearGradient></defs><path d='M32 34 Q32 20 42 20 Q58 20 58 34' stroke='%23BA7517' stroke-width='3' stroke-linecap='round' fill='none'/><rect x='22' y='34' width='46' height='46' rx='8' fill='url(%23b)'/><line x1='22' y1='46' x2='68' y2='46' stroke='white' stroke-width='1' stroke-opacity='0.25'/><line x1='33' y1='56' x2='43' y2='70' stroke='white' stroke-width='2.5' stroke-linecap='round'/><line x1='43' y1='56' x2='33' y2='70' stroke='white' stroke-width='2.5' stroke-linecap='round'/><ellipse cx='55' cy='63' rx='7' ry='7' stroke='white' stroke-width='2.5' fill='none'/><circle cx='66' cy='28' r='7' fill='%23D85A30'/><circle cx='66' cy='27' r='2.2' fill='white'/></svg>",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dm.variable}`}>
      <body>{children}</body>
    </html>
  );
}
