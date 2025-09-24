"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Stat = { key: string; title: string; url: string; to?: string; count: number | null; err?: string };

const SOURCES: Array<Omit<Stat, "count">> = [
  { key: "authors",      title: "Autores",        url: "/api/authors",       to: "/authors" },
  { key: "books",        title: "Libros",         url: "/api/books",         to: "/books" },
  { key: "prizes",       title: "Premios",        url: "/api/prizes",        to: "/prizes" },
  { key: "editorials",   title: "Editoriales",    url: "/api/editorials",    to: "/editorials" },
  { key: "organizations",title: "Organizaciones", url: "/api/organizations", to: "/organizations" },
  // Para reviews no siempre hay endpoint global; si lo tienes, descomenta:
  // { key: "reviews",   title: "Reseñas",        url: "/api/reviews",       to: "/books" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stat[]>(
    SOURCES.map((s) => ({ ...s, count: null }))
  );

  useEffect(() => {
    (async () => {
      const next: Stat[] = [];
      for (const s of SOURCES) {
        try {
          const res = await fetch(s.url, { cache: "no-store" });
          if (!res.ok) throw new Error(String(res.status));
          const data = await res.json();
          const count = Array.isArray(data) ? data.length : (typeof data?.count === "number" ? data.count : 0);
          next.push({ ...s, count });
        } catch (e) {
          next.push({ ...s, count: null, err: e instanceof Error ? e.message : "err" });
        }
      }
      setStats(next);
    })();
  }, []);

  return (
    <main className="container-page space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.key} className="card p-4">
            <div className="text-sm text-zinc-400">{s.title}</div>
            <div className="mt-2 text-3xl font-semibold">
              {s.count ?? "—"}
            </div>
            <div className="mt-3">
              {s.to ? (
                <Link href={s.to} className="btn btn-ghost">Abrir</Link>
              ) : null}
            </div>
            {s.err ? <div className="mt-2 text-xs text-red-400">({s.err})</div> : null}
          </div>
        ))}
      </section>
    </main>
  );
}