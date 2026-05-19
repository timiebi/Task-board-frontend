import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Task Board",
  description: "Tasks, notes, plans, and reminders",
  applicationName: "Task Board",
  appleWebApp: {
    capable: true,
    title: "Task Board",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const DEFAULT_THEME = "light";

const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('taskboard_theme');
    if (t !== 'light' && t !== 'dark') t = '${DEFAULT_THEME}';
    var root = document.documentElement;
    root.setAttribute('data-theme', t);
    if (t === 'dark') root.classList.add('ion-palette-dark');
    else root.classList.remove('ion-palette-dark');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', t === 'dark' ? '#191919' : '#ffffff');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body className={inter.className}>
        <div
          id="initial-splash"
          className="app-splash"
          role="status"
          aria-busy="true"
          aria-label="Loading Task Board"
        >
          <div className="app-splash-logo" aria-hidden>
            TB
          </div>
          <div className="app-splash-spinner" aria-hidden />
        </div>
        {children}
      </body>
    </html>
  );
}
