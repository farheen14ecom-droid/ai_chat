import type { Metadata } from "next";
import "./global.css";

export const metadata: Metadata = {
  title: "Chat with tools",
  description: "Streaming chat app with tool calling",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}