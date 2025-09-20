"use client";

import Link from "next/link";
import { useAuthors } from "@/context/AuthorsContext";
import { BookOpen, Plus, MoveRight, Database, Sparkles, ExternalLink } from "lucide-react";

export default function Home() {
  const { authors, loading } = useAuthors();
  const recent = (authors ?? []).slice(0, 4);

  return (
    <div className="relative">
      {/* fondo decorativo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-brand-600/10 blur-3xl" />
        <div className="absolute top-40 right-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      {/* Hero */}
      <section className="card p-8 md:p-10">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full bg-zinc-800/60 px-3 py-1 text-xs text-zinc-300 ring-1 ring-zinc-700">
              <Sparkles size={14} /> Bienvenido
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold leading-tight">
              Bookstore <span className="text-brand-500">— CRUD Autores</span>
            </h1>
            <p className="max-w-2xl text-sm text-zinc-300">
              Administra autores: crear, listar, editar y eliminar. Todo conectado a tu API de Spring Boot.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Link href="/authors" className="btn btn-ghost">
                <BookOpen size={16} /> Ver autores
              </Link>
              <Link href="/crear" className="btn btn-primary">
                <Plus size={16} /> Crear autor
              </Link>

              <a
                href="/api/h2-console"
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost"
                title="Abrir consola H2 en una pestaña nueva"
              >
                <Database size={16} /> H2 Console <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* contador */}
          <div className="hidden sm:block rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 text-center">
            <div className="text-3xl font-semibold">{loading ? "…" : authors.length}</div>
            <div className="mt-1 text-xs text-zinc-400">autor(es)</div>
          </div>
        </div>
      </section>


      {/* Recientes */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Autores recientes</h2>
          <Link href="/authors" className="text-sm text-brand-500 hover:underline">
            Ver todo
          </Link>
        </div>

        {loading ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="card p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="h-12 w-12 rounded-xl bg-zinc-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 rounded bg-zinc-800" />
                    <div className="h-3 w-24 rounded bg-zinc-800" />
                    <div className="h-3 w-full rounded bg-zinc-800" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : recent.length === 0 ? (
          <div className="card p-6 text-sm text-zinc-400">
            No hay autores por ahora. Crea el primero desde el botón de arriba.
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {recent.map((a) => (
              <li key={String(a.id)} className="card p-4">
                <div className="flex gap-3">
                  {a.image ? (
                    <img
                      src={a.image.startsWith("http") ? a.image : `/images/${a.image.replace(/^\/+/, "")}`}
                      alt={a.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-xl object-cover ring-1 ring-zinc-800"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-zinc-800 ring-1 ring-zinc-800" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-medium">{a.name}</p>
                      <span className="shrink-0 text-xs text-zinc-500">{a.birthDate}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-300">{a.description}</p>

                    <div className="mt-3 flex gap-2">
                      <Link href="/authors" className="btn btn-ghost px-3 py-1.5 text-xs">
                        Ver lista
                      </Link>
                      <Link
                        href={`/authors/${encodeURIComponent(String(a.id))}/edit`}
                        className="btn px-3 py-1.5 text-xs"
                      >
                        Editar
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Piecito */}
    </div>
  );
}