// frontend/lib/books.ts
import { HttpError } from "@/lib/api";
import type { Book } from "@/types/book";

// --- LISTAR ---

export async function fetchBooks(): Promise<Book[]> {
  const res = await fetch(`/api/books`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Error fetching books: ${res.status}`);
  return res.json();
}

// Lista de libros de un autor (endpoint oficial del backend)
export async function fetchBooksByAuthorStrict(authorId: string | number): Promise<Book[]> {
  const res = await fetch(`/api/authors/${authorId}/books`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Error fetching books by author: ${res.status}`);
  return res.json();
}

// Quita la relación autor-libro (NO borra el libro)
export async function removeBookFromAuthor(authorId: string | number, bookId: string | number): Promise<void> {
  const res = await fetch(`/api/authors/${authorId}/books/${bookId}`, { method: "DELETE" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DELETE /api/authors/${authorId}/books/${bookId} -> ${res.status} ${text}`);
  }
}

export async function fetchBooksByAuthor(authorId: string | number): Promise<Book[]> {
  const tryUrls = [
    `/api/books?authorId=${authorId}`,
    `/api/books/author/${authorId}`,
    `/api/books/by-author/${authorId}`,
  ];
  for (const u of tryUrls) {
    const r = await fetch(u, { cache: "no-store" });
    if (r.ok) {
      try {
        const arr: unknown = await r.json();
        if (Array.isArray(arr)) return arr as Book[];
      } catch { /* ignore parse errors */ }
    }
  }
  const all = await fetchBooks();
  return all.filter(b => String(b.authorId ?? b.author?.id) === String(authorId));
}

// --- DETALLE Y UNLINK “fuerte” ---

export async function fetchBook(id: string | number): Promise<Book | null> {
  const urls = [`/api/books/${id}`, `/api/books?id=${id}`];
  for (const u of urls) {
    const r = await fetch(u, { cache: "no-store" });
    if (r.ok) {
      try {
        const data: unknown = await r.json();
        if (data && typeof data === "object") return data as Book;
      } catch { /* ignore */ }
    }
  }
  return null;
}

async function putJson(url: string, body: unknown): Promise<boolean> {
  const r = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.ok;
}

/** Intenta desasociar el libro del autor enviando payloads comunes */
export async function unlinkBookFromAuthorStrong(
  bookId: string | number,
  authorId: string | number
): Promise<boolean> {
  const book = await fetchBook(bookId);
  if (!book) return false;

  // Construimos variantes sin usar "any"
  const base = book as unknown as Record<string, unknown>;
  const variants: Array<Record<string, unknown>> = [
    { ...base, authorId: null },
    { ...base, author: null },
    { ...base, authors: [] }, // muchos-a-muchos
    { id: book.id, title: (book as Book).title, authorId: null },
    { id: book.id, title: (book as Book).title, author: null },
  ];

  for (const body of variants) {
    try {
      if (await putJson(`/api/books/${bookId}`, body)) return true;
    } catch { /* probar siguiente variante */ }
  }

  // Endpoints alternativos típicos
  const alt = [
    { method: "POST", url: `/api/books/${bookId}/unlink-author/${authorId}` },
    { method: "DELETE", url: `/api/books/${bookId}/authors/${authorId}` },
  ] as const;

  for (const a of alt) {
    try {
      const r = await fetch(a.url, { method: a.method });
      if (r.ok) return true;
    } catch { /* ignore */ }
  }

  return false;
}

// --- DELETE libro ---

export async function deleteBook(id: string | number): Promise<void> {
  const res = await fetch(`/api/books/${id}`, { method: "DELETE" });

  if (res.status === 412) {
    let msg = "No se puede eliminar el libro porque está asociado a un autor.";
    try {
      const payload: unknown = await res.json();
      if (payload && typeof payload === "object" && "apierror" in payload) {
        const apierror = (payload as { apierror?: { message?: string } }).apierror;
        if (apierror?.message) msg = apierror.message;
      }
    } catch { /* ignore */ }
    throw new HttpError(412, msg);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DELETE /api/books/${id} -> ${res.status} ${text}`);
  }
}