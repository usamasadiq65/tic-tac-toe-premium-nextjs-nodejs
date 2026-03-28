import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tic Tac Toe – Play Online, vs AI, or Locally",
  description: "A beautiful, real-time multiplayer Tic Tac Toe game. Play versus AI with 3 difficulty levels, challenge a friend locally, or compete online with room codes.",
  keywords: ["tic tac toe", "online multiplayer", "game", "AI", "real-time"],
  openGraph: {
    title: "Tic Tac Toe",
    description: "Play Tic Tac Toe online, vs AI, or on the same device with a friend.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
