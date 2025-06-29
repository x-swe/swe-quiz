import "./globals.css";
import StarsCanvas from "../components/StarsCanvas";

export const metadata = {
  title: "Software Engineering Quiz",
  description: "A voice-activated software engineering quiz powered by Vapi AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <StarsCanvas />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
