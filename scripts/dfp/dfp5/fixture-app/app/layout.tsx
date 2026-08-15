import "@/app/globals.css";

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function Dfp5FixtureLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
