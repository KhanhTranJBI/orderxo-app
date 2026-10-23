import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import ToastProvider from "../components/ToastProvider";

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
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dm.variable}`}>
      <body>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
