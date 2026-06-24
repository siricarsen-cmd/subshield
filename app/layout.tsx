import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "SubShield | Pre-Attorney Contract Triage Platform",
  description: "Identify procurement liabilities, flow-down parameters, and payment traps before legal discovery starts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F4F5F7]">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}