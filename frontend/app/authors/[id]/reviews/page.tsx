"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Id = string | number;

type Review = {
  id?: Id;
  author: string;
  rating: number;       
  text: string;
  createdAt?: string;
  [k: string]: unknown;
};

type ReviewsResponse = Review[];

type NewReview = { author: string; rating: number; text: string };

export default function BookReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const bookId = String(id);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | undefined>();

  const [form, setForm] = useState<NewReview>({ author: "", rating: 5, text: "" });
  const valid = useMemo(
    () =>
      form.author.trim().length >= 2 &&
      form.text.trim().length >= 3 &&
      form.rating >= 1 &&
      form.rating <= 5,
    [form]
  );

  const getCandidates = useMemo(
    () => [
      `/api/books/${bookId}/reviews`,
      `/api/reviews?bookId=${encodeURIComponent(bookId)}`,
      `/api/reviews?book=${encodeURIComponent(bookId)}`,
    ],
    [bookId]
  );

  const postCandidates = useMemo(
    () => [
      { url: `/api/books/${bookId}/reviews`, body: (r: NewReview) => r },
      { url: `/api/reviews`, body: (r: NewReview) => ({ ...r, bookId }) },
      { url: `/api/reviews`, body: (r: NewReview) => ({ ...r, book: bookId }) },
    ],
    [bookId]
  );

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let ok = false;
        let lastMsg = "";
        for (const url of getCandidates) {
          const res = await fetch(url, { cache: "no-store" });
          if (res.ok) {
            const data: ReviewsResponse = await res.json();
            setReviews(Array.isArray(data) ? data : []);
            ok = true;
            break;
          } else {
            const txt = await res.text().catch(() => "");
            lastMsg = `${url} -> ${res.status} ${txt}`;
          }
        }
        if (!ok) throw new Error(lastMsg || "No fue posible cargar las reseñas.");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Error cargando reseñas");
      } finally {
        setLoading(false);
      }
    })();
  }, [getCandidates]);

  async function publish() {
    if (!valid) return;
    try {
      let ok = false;
      let lastTxt = "";
      for (const cand of postCandidates) {
        const res = await fetch(cand.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cand.body(form)),
        });
        if (res.ok || res.status === 201) {
          const saved: Review = await res.json().catch(() => ({ ...form }));
          setReviews((prev) => [saved, ...prev]);
          ok = true;
          break;
        } else {
          lastTxt = await res.text().catch(() => "");
        }
      }
      if (!ok) throw new Error(lastTxt || "No fue posible crear la reseña.");
      setForm({ author: "", rating: 5, text: "" });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error publicando reseña");
    }
  }

  if (loading) return <main className="container-page">Cargando reseñas…</main>;
  if (err) return <main className="container-page text-red-400">Error: {err}</main>;

  return (
    <main className="container-page space-y-6">
      <h1 className="text-xl font-semibold">Reseñas del libro #{bookId}</h1>

      <section className="card p-4 space-y-3">
        <h2 className="font-medium">Crear reseña</h2>
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
          <button disabled={!valid} className="btn btn-primary" onClick={publish}>
            Publicar
          </button>
        </div>
      </section>

      <section className="card p-4 space-y-3">
        <h2 className="font-medium">Reseñas</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-zinc-400">No hay reseñas aún.</p>
        ) : (
          <ul className="grid gap-3">
            {reviews.map((r, idx) => (
              <li key={String(r.id ?? idx)} className="rounded-xl bg-zinc-900/60 p-3 ring-1 ring-zinc-800">
                <div className="flex items-baseline justify-between">
                  <strong className="truncate">{r.author}</strong>
                  <span className="text-xs text-zinc-400">
                    {r.rating} ⭐ {r.createdAt ? `· ${new Date(r.createdAt).toLocaleDateString()}` : ""}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-300 whitespace-pre-wrap">{r.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}