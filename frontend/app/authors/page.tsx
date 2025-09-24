"use client";

import { useAuthors } from "@/context/AuthorsContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function AuthorsPage() {
  const router = useRouter();
  const { authors, loading, error, removeAuthor } = useAuthors();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return authors;
    return authors.filter(a =>
      [a.name, a.description].some(s => (s ?? "").toLowerCase().includes(q))
    );
  }, [authors, query]);

  if (loading) return <p className="text-zinc-400">Cargando…</p>;
  if (error) return (
    <div className="card p-6">
      <p className="text-red-400">Error: {error}</p>
      <button className="btn btn-ghost mt-3" onClick={() => location.reload()}>Reintentar</button>
    </div>
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Autores</h1>
        <div className="flex items-center gap-2">
          <input
            className="input max-w-xs"
            placeholder="Buscar por nombre o descripción…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Link href="/crear" className="btn btn-primary">＋ Crear autor</Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-zinc-400">No hay coincidencias.</div>
      ) : (
        <ul className="grid gap-4">
          {filtered.map(a => (
            <li key={String(a.id)} className="card p-4">
              <div className="flex gap-4">
                {a.image ? (
                  <img
                    src={a.image.startsWith("http") ? a.image : `/images/${a.image.replace(/^\/+/, "")}`}
                    alt={a.name}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-xl object-cover ring-1 ring-zinc-800"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-zinc-800 ring-1 ring-zinc-800" />
                )}

                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-semibold">{a.name}</h3>
                    <span className="text-xs text-zinc-400">{a.birthDate}</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-300">{a.description}</p>

                  <div className="mt-4 flex gap-2">
                    <button
                      className="btn btn-ghost"
                      onClick={() => router.push(`/authors/${encodeURIComponent(String(a.id))}/edit`)}
                    >
                      Editar
                    </button>
                    <Link
                      className="btn btn-ghost"
                      href={`/authors/${encodeURIComponent(String(a.id))}/prizes`}
                    >
                      Premios
                    </Link>
                    <button
                      className="btn btn-danger"
                      onClick={async () => {
                        if (!confirm("¿Seguro que quieres eliminar?")) return;
                        await removeAuthor(a.id);
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}