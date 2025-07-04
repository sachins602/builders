import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import Header from "./_components/header";
import Footer from "./_components/footer/footer";

import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Our Missing Middle",
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
      <body className="h-screen bg-white text-black">
        <TRPCReactProvider>
          {/* Sonner Toast Notifications */}
          <Toaster position="top-center" visibleToasts={1} duration={10000} />

          {/* Main container for the layout */}
          <div className="flex h-full flex-col">
            {/* Fixed Header */}
            <Header />

            {/* Non-Scrollable Main content area */}

            <main className="coverflow-y-auto container mx-auto flex-1 px-12 py-2">
              {children}
            </main>

            {/* Fixed Footer */}
            <Footer />
          </div>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
