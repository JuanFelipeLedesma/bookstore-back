"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Id = string | number;

type AuthorForm = {
  name: string;
  birthDate: string;
  image?: string;
  description?: string;
};

type BookForm = {
  name: string;
  description?: string;
};

type PrizeForm = {
  name: string;
  description?: string;
};

export default function CreateAuthorPage() {
  const router = useRouter();

  // ----- formularios -----
  const [author, setAuthor] = useState<AuthorForm>({
    name: "",
    birthDate: new Date().toISOString().slice(0, 10),
    image: "",
    description: "",
  });

  const [book, setBook] = useState<BookForm>({ name: "", description: "" });
  const [prize, setPrize] = useState<PrizeForm>({ name: "", description: "" });

  const [busy, setBusy] = useState(false);
  const valid = useMemo(
    () => author.name.trim().length >= 2 && book.name.trim().length >= 2 && prize.name.trim().length >= 2,
    [author.name, book.name, prize.name]
  );

  // ----- helpers de fetch tipados -----
  async function json<T>(res: Response): Promise<T> {
    const txt = await res.text();
    try {
      return JSON.parse(txt) as T;
    } catch {
      return {} as T;
    }
  }

  async function postJSON<T>(url: string, body: unknown): Promise<{ ok: boolean; status: number; data: T; raw: Response }> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await json<T>(res);
    return { ok: res.ok, status: res.status, data, raw: res };
  }

  async function tryPostOrPut(url: string): Promise<void> {
    let res = await fetch(url, { method: "POST" });
    if (!res.ok && res.status !== 204) {
      res = await fetch(url, { method: "PUT" });
    }
    if (!res.ok && res.status !== 204) {
      const txt = await res.text().catch(() => "");
      throw new Error(`${url} -> ${res.status} ${txt}`);
    }
  }

  async function onSubmit() {
    if (!valid) return;
    setBusy(true);
    try {
      const a = await postJSON<{ id: Id }>(`/api/authors`, author);
      if (!a.ok) throw new Error(`POST /authors -> ${a.status}`);
      const authorId = (a.data as { id?: Id })?.id;
      if (authorId === undefined || authorId === null) throw new Error("El backend no devolvió id del autor.");

      const b = await postJSON<{ id: Id }>(`/api/books`, { name: book.name, description: book.description });
      if (!b.ok) throw new Error(`POST /books -> ${b.status}`);
      const bookId = (b.data as { id?: Id })?.id;
      if (bookId === undefined || bookId === null) throw new Error("El backend no devolvió id del libro.");

      await tryPostOrPut(`/api/authors/${authorId}/books/${bookId}`);

      const p = await postJSON<{ id: Id }>(`/api/prizes`, { name: prize.name, description: prize.description });
      if (!p.ok) throw new Error(`POST /prizes -> ${p.status}`);
      const prizeId = (p.data as { id?: Id })?.id;
      if (prizeId === undefined || prizeId === null) throw new Error("El backend no devolvió id del premio.");

      await tryPostOrPut(`/api/prizes/${prizeId}/author/${authorId}`);

      alert("Autor creado y asociado con libro y premio ✅");
      router.push("/authors");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error creando autor/libro/premio");
    } finally {
      setBusy(false);
    }
  }

  const initials =
    author.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "NA";

  return (
    <main className="container-page">
      <h1 className="text-xl font-semibold mb-6">Crear autor</h1>

      <div className="card p-5 space-y-6 max-w-3xl mx-auto">
        {/* Autor */}
        <section className="space-y-3">
          <h2 className="font-medium">Autor</h2>
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-lg font-semibold">
              {initials}
            </div>
            <input
              className="input"
              placeholder="Nombre del autor"
              value={author.name}
              onChange={(e) => setAuthor((s) => ({ ...s, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Fecha de nacimiento</label>
            <input
              type="date"
              className="input"
              value={author.birthDate}
              onChange={(e) => setAuthor((s) => ({ ...s, birthDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">URL imagen</label>
            <input
              className="input"
              placeholder="https://…"
              value={author.image}
              onChange={(e) => setAuthor((s) => ({ ...s, image: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Biografía breve…"
              value={author.description}
              onChange={(e) => setAuthor((s) => ({ ...s, description: e.target.value }))}
            />
          </div>
        </section>

        {/* Libro */}
        <section className="space-y-3">
          <h2 className="font-medium">Libro (obligatorio)</h2>
          <div>
            <label className="label">Nombre del libro</label>
            <input
              className="input"
              placeholder="Título"
              value={book.name}
              onChange={(e) => setBook((s) => ({ ...s, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Descripción del libro…"
              value={book.description}
              onChange={(e) => setBook((s) => ({ ...s, description: e.target.value }))}
            />
          </div>
        </section>

        {/* Premio */}
        <section className="space-y-3">
          <h2 className="font-medium">Premio (obligatorio)</h2>
          <div>
            <label className="label">Nombre del premio</label>
            <input
              className="input"
              placeholder="Nombre del premio"
              value={prize.name}
              onChange={(e) => setPrize((s) => ({ ...s, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Descripción del premio…"
              value={prize.description}
              onChange={(e) => setPrize((s) => ({ ...s, description: e.target.value }))}
            />
          </div>
        </section>

        <div className="flex gap-2">
          <button disabled={!valid || busy} className="btn btn-primary" onClick={onSubmit}>
            {busy ? "Guardando…" : "Guardar"}
          </button>
          <button className="btn btn-ghost" onClick={() => router.push("/authors")}>
            Cancelar
          </button>
        </div>
      </div>
    </main>
  );
}