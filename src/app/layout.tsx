import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Imperial Codex",
  description: "Imperial Codex application",
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
