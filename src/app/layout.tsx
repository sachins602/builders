import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import Header from "./_components/header";
import Footer from "./_components/footer";

export const metadata: Metadata = {
  title: "The Missing Middle",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="bg-white min-h-screen flex flex-col text-black text-center">
        <TRPCReactProvider>

          {/* Header component */}
          <Header />

          {/* Main content area */}
          <div className="container px-12 py-2 mx-auto">{children}</div>

          {/* Spacer to push footer to the bottom */}
          <div className="flex-1" />

          {/* Footer component */}
          <Footer />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
