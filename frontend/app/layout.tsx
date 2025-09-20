import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Authors CRUD",
  description: "Pre-parcial Next.js",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <header className="border-b border-zinc-800 bg-[linear-gradient(120deg,#0b1320,#0a0a0a)]">
            <div className="container-page flex items-center justify-between py-4">
              <Link href="/" className="text-lg font-semibold tracking-tight">
                Bookstore <span className="text-brand-500">— CRUD Autores</span>
              </Link>
              <nav className="flex items-center gap-2">
                <Link className="btn btn-ghost" href="/authors"> Ver autores</Link>
                <Link className="btn btn-primary" href="/crear">＋ Crear autor</Link>
              </nav>
            </div>
          </header>

          <main className="container-page">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
