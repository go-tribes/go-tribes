import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Go-Tribes | Plan Your Adventure",
  description: "Personalize, Plan, and Explore your next journey with Go-Tribes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Include Leaflet CSS for Map Display */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css"
          integrity="sha256-sA+e2Tu/6GmJ+M2eUzE9tPcOZyb7NPAZ+U9k4PQGNI4="
          crossOrigin=""
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
