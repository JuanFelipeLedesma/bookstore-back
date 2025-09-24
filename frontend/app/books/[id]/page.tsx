"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Id = string | number;

type Book = {
  id: Id;
  name: string;
  description?: string;
  [k: string]: unknown;
};

type Review = {
  id?: Id;
  author: string;
  rating: number; 
  text: string;
  createdAt?: string;
  [k: string]: unknown;
};

type NewReview = { author: string; rating: number; text: string };

function getFirstString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}
function getFirstNumber(obj: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number") return v;
    if (typeof v === "string" && v !== "" && !Number.isNaN(Number(v))) return Number(v);
  }
  return undefined;
}

function Stars({ value }: { value?: number }) {
  const n = Math.max(0, Math.min(5, Math.round(value ?? 0)));
  return (
    <span className="text-yellow-400" aria-label={`${n} estrellas`}>
      {"★".repeat(n)}
      <span className="text-zinc-600">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export default function BookDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const bookId = String(params.id);

  const [book, setBook] = useState<Book | null>(null);
  const [bookErr, setBookErr] = useState<string | undefined>();
  const [bookLoading, setBookLoading] = useState(true);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [revErr, setRevErr] = useState<string | undefined>();
  const [revLoading, setRevLoading] = useState(true);

  const [form, setForm] = useState<NewReview>({ author: "", rating: 5, text: "" });
  const [sending, setSending] = useState(false);

  const valid = useMemo(
    () =>
      form.author.trim().length >= 2 &&
      form.text.trim().length >= 3 &&
      form.rating >= 1 &&
      form.rating <= 5,
    [form]
  );

  async function readJson<T>(res: Response): Promise<T> {
    const txt = await res.text();
    try {
      return JSON.parse(txt) as T;
    } catch {
      return {} as T;
    }
  }

  const bookGetCandidates = useMemo(
    () => [`/api/books/${bookId}`, `/api/book/${bookId}`],
    [bookId]
  );

  const reviewsGetCandidates = useMemo(
    () => [
      `/api/books/${bookId}/reviews`,
      `/api/reviews?bookId=${encodeURIComponent(bookId)}`,
      `/api/reviews?book=${encodeURIComponent(bookId)}`,
    ],
    [bookId]
  );

  const reviewsPostCandidates = useMemo(
    () => [
      { url: `/api/books/${bookId}/reviews`, body: (r: NewReview) => r },
      { url: `/api/reviews`, body: (r: NewReview) => ({ ...r, bookId }) },
      { url: `/api/reviews`, body: (r: NewReview) => ({ ...r, book: bookId }) },
    ],
    [bookId]
  );

  useEffect(() => {
    (async () => {
      setBookLoading(true);
      setBookErr(undefined);
      try {
        let ok = false;
        let last = "";
        for (const url of bookGetCandidates) {
          const res = await fetch(url, { cache: "no-store" });
          if (res.ok) {
            const data = await readJson<Book>(res);
            setBook(data);
            ok = true;
            break;
          } else {
            last = `${url} -> ${res.status}`;
          }
        }
        if (!ok) throw new Error(last || "No fue posible cargar el libro.");
      } catch (e) {
        setBookErr(e instanceof Error ? e.message : "Error cargando libro");
      } finally {
        setBookLoading(false);
      }
    })();
  }, [bookGetCandidates]);

  useEffect(() => {
    (async () => {
      setRevLoading(true);
      setRevErr(undefined);
      try {
        let ok = false;
        let last = "";
        for (const url of reviewsGetCandidates) {
          const res = await fetch(url, { cache: "no-store" });
          if (res.ok) {
            const data = await readJson<Review[]>(res);
            setReviews(Array.isArray(data) ? data : []);
            ok = true;
            break;
          } else {
            last = `${url} -> ${res.status}`;
          }
        }
        if (!ok) throw new Error(last || "No fue posible cargar las reseñas.");
      } catch (e) {
        setRevErr(e instanceof Error ? e.message : "Error cargando reseñas");
      } finally {
        setRevLoading(false);
      }
    })();
  }, [reviewsGetCandidates]);

  async function publish() {
    if (!valid || sending) return;
    setSending(true);
    try {
      let ok = false;
      let lastTxt = "";
      let saved: Review | null = null;

      for (const cand of reviewsPostCandidates) {
        const res = await fetch(cand.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cand.body(form)),
        });
        if (res.ok || res.status === 201) {
          saved = await readJson<Review>(res).catch(() => ({ ...form }));
          ok = true;
          break;
        } else {
          lastTxt = await res.text().catch(() => "");
        }
      }

      if (!ok) throw new Error(lastTxt || "No fue posible crear la reseña.");

      setReviews((prev) => (saved ? [saved, ...prev] : [{ ...form }, ...prev]));
      setForm({ author: "", rating: 5, text: "" });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error publicando reseña");
    } finally {
      setSending(false);
    }
  }

  if (bookLoading) return <main className="container-page">Cargando libro…</main>;
  if (bookErr) return <main className="container-page text-red-400">Error: {bookErr}</main>;

  return (
    <main className="container-page space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {book?.name ?? `Libro #${bookId}`}
        </h1>
        <button className="btn btn-ghost" onClick={() => router.back()}>
          Volver
        </button>
      </div>

      {book?.description ? (
        <p className="text-zinc-300">{book.description}</p>
      ) : null}

      <section className="card p-4 space-y-3">
        <h2 className="font-medium">Agregar reseña</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">Autor del comentario</label>
            <input
              className="input"
              value={form.author}
              onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="label">Calificación</label>
            <select
              className="input"
              value={form.rating}
              onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} ⭐
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Texto</label>
          <textarea
            className="input"
            rows={3}
            value={form.text}
            onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
            placeholder="Escribe tu reseña…"
          />
        </div>
        <div>
          <button disabled={!valid || sending} className="btn btn-primary" onClick={publish}>
            {sending ? "Publicando…" : "Publicar reseña"}
          </button>
        </div>
      </section>

      <section className="card p-4 space-y-3">
        <h2 className="font-medium">Reseñas</h2>
        {revLoading ? (
          <p>Cargando reseñas…</p>
        ) : revErr ? (
          <p className="text-red-400">Error: {revErr}</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-zinc-400">No hay reseñas aún.</p>
        ) : (
          <ul className="grid gap-3">
            {reviews.map((r, idx) => {
              const obj = r as unknown as Record<string, unknown>;
              const author =
                getFirstString(obj, ["author", "autor", "user", "usuario", "name", "critic", "createdBy"]) ?? "Anónimo";
              const text =
                getFirstString(obj, ["text", "comment", "comentario", "description", "descripcion", "content", "review", "detalle"]) ??
                "(sin texto)";
              const rating = getFirstNumber(obj, ["rating", "score", "stars", "calificacion", "puntuacion", "puntaje"]);
              const date =
                getFirstString(obj, ["createdAt", "date", "fecha", "created_on", "created"]) || undefined;

              return (
                <li
                  key={String((obj.id as string | number | undefined) ?? idx)}
                  className="rounded-xl bg-zinc-900/60 p-3 ring-1 ring-zinc-800"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <strong className="block truncate">{author}</strong>
                      {date ? (
                        <span className="text-xs text-zinc-500">
                          {new Date(date).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                    <div className="shrink-0">
                      <Stars value={rating} />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-zinc-300 whitespace-pre-wrap">{text}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}