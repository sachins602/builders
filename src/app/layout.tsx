import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import Header from "./_components/header";
import Footer from "./_components/footer";

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
          <Toaster position="top-center" visibleToasts={1} duration={10000}/>
          <div className="flex h-full flex-col">
            {/* Fixed Header */}
            <Header />

            {/* Scrollable Main content area */}
            <main className="flex-1 overflow-y-auto">
              <div className="container mx-auto px-12 py-2">{children}</div>
            </main>

            {/* Fixed Footer */}
            <Footer />
          </div>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
