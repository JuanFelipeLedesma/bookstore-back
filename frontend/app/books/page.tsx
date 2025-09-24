"use client";

import { JSX, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Id = string | number;

type Book = {
  id: Id;
  name?: string;     
  title?: string;    
  description?: string;
  image?: string;
};

type Author = { id: Id; name?: string; image?: string };

async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${text}`);
  }
  return res.json();
}

export default function BooksPage(): JSX.Element {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [authorsByBook, setAuthorsByBook] = useState<Record<string, Author[]>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const data = await getJSON<Book[]>("/api/books");
        setBooks(data);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : typeof err === "string"
            ? err
            : "Error cargando libros";
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const ensureAuthors = async (bookId: Id) => {
    const key = String(bookId);
    if (authorsByBook[key]) return;
    try {
      const data = await getJSON<Author[]>(`/api/books/${bookId}/authors`);
      setAuthorsByBook((s) => ({ ...s, [key]: data }));
    } catch {
      setAuthorsByBook((s) => ({ ...s, [key]: [] }));
    }
  };

  const onToggle = async (bookId: Id) => {
    const key = String(bookId);
    setOpen((s) => ({ ...s, [key]: !s[key] }));
    if (!authorsByBook[key]) await ensureAuthors(bookId);
  };

  const onDelete = async (book: Book) => {
    const display = book.name ?? book.title ?? "(Sin título)";
    if (!confirm(`¿Seguro que quieres eliminar el libro "${display}"?`)) return;

    const attemptDelete = () =>
      fetch(`/api/books/${book.id}`, { method: "DELETE" });

    let res = await attemptDelete();
    if (res.ok) {
      setBooks((list) => list.filter((b) => String(b.id) !== String(book.id)));
      return;
    }


    if (res.status === 412) {
      let authors: Author[] = [];
      try {
        authors = await getJSON<Author[]>(`/api/books/${book.id}/authors`);
      } catch {
        authors = [];
      }

      const total = authors.length;
      const wantsCascade = confirm(
        total > 0
          ? `No se puede eliminar porque tiene ${total} autor(es) asociados.\n\n¿Quieres desasociarlos automáticamente y luego eliminar el libro?`
          : `El backend reporta una restricción (412).\n\n¿Intentar de nuevo de todas formas?`
      );

      if (!wantsCascade) return;

      for (const a of authors) {
        const authorId = a.id;
        try {
          await fetch(`/api/books/${book.id}/authors/${authorId}`, {
            method: "DELETE",
          });
        } catch {
        }
      }

      res = await attemptDelete();
      if (res.ok) {
        setBooks((list) => list.filter((b) => String(b.id) !== String(book.id)));
        return;
      }

      const text = await res.text().catch(() => "");
      alert(
        `No se pudo completar la eliminación en cascada:\n` +
          (text ||
            "El backend no permite borrar libros mientras estén asociados a autores.")
      );
      return;
    }

    {
      const text = await res.text().catch(() => "");
      alert(`DELETE /api/books/${book.id} -> ${res.status} ${text}`);
    }
  };

  const content = useMemo(() => {
    if (loading) return <p className="text-zinc-400">Cargando…</p>;
    if (error) return <p className="text-red-400">Error: {error}</p>;
    if (books.length === 0)
      return (
        <div className="card p-6 text-center text-zinc-400">
          No hay libros.{" "}
          <Link href="/authors" className="text-brand-500 hover:underline">
            Ver autores
          </Link>{" "}
          o usa la API para cargar datos.
        </div>
      );

    return (
      <ul className="grid gap-4">
        {books.map((b) => {
          const akey = String(b.id);
          const authors = authorsByBook[akey] ?? [];
          const isOpen = !!open[akey];
          const title = b.name ?? b.title ?? "(Sin título)";
          const img =
            b.image &&
            (b.image.startsWith("http") ? b.image : `/images/${b.image.replace(/^\/+/, "")}`);

          return (
            <li key={akey} className="card p-4">
              <div className="flex gap-4">
                {img ? (
                  <img
                    src={img}
                    alt={title}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-xl object-cover ring-1 ring-zinc-800"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-zinc-800 ring-1 ring-zinc-800" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link href={`/books/${encodeURIComponent(String(b.id))}`} className="font-semibold truncate hover:underline">
                      {title}
                    </Link>
                  </div>

                  {b.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-300">{b.description}</p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      className="btn btn-ghost px-3 py-1.5 text-xs"
                      onClick={() => onToggle(b.id)}
                    >
                      {isOpen ? "Ocultar autores" : "Mostrar autores"}
                    </button>
                    <Link
                      href={`/books/${encodeURIComponent(String(b.id))}`}
                      className="btn btn-ghost px-3 py-1.5 text-xs"
                    >
                      Ver detalle
                    </Link>
                    <button
                      className="btn btn-danger px-3 py-1.5 text-xs"
                      onClick={() => onDelete(b)}
                    >
                       Eliminar
                    </button>
                  </div>

                  {isOpen && (
                    <div className="mt-3">
                      {authors.length === 0 ? (
                        <p className="text-xs text-zinc-400">Sin autores asociados.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {authors.map((a) => (
                            <span
                              key={String(a.id)}
                              className="inline-flex items-center gap-2 rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-200 ring-1 ring-zinc-700"
                            >
                              {a.image ? (
                                <img
                                  src={
                                    a.image.startsWith("http")
                                      ? a.image
                                      : `/images/${a.image.replace(/^\/+/, "")}`
                                  }
                                  alt={a.name ?? "Autor"}
                                  width={18}
                                  height={18}
                                  className="h-[18px] w-[18px] rounded-full object-cover"
                                />
                              ) : (
                                <span className="h-[18px] w-[18px] rounded-full bg-zinc-700" />
                              )}
                              {a.name ?? "Autor"}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }, [books, loading, error, authorsByBook, open]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Libros</h1>
        <Link href="/" className="text-sm text-brand-500 hover:underline">
          Volver al inicio
        </Link>
      </div>
      {content}
    </section>
  );
}