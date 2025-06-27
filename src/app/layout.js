import "./globals.css";

export const metadata = {
  title: "Software Engineering Quiz",
  description: "A voice-activated software engineering quiz powered by Vapi AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
