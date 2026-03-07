import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Virtual Lab | Interactive Science Experiments",
  description: "Experience hands-on science with interactive virtual experiments in physics, chemistry, and optics. Save your results and track your learning journey.",
  keywords: ["virtual lab", "science experiments", "physics simulator", "chemistry lab", "interactive learning"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
