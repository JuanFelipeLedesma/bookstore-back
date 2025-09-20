import type { Author } from "@/types/author";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function fetchAuthors(): Promise<Author[]> {
  const res = await fetch(`/api/authors`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Error fetching authors: ${res.status}`);
  return res.json();
}

export async function fetchAuthor(id: string | number) {
  const res = await fetch(`/api/authors/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Error fetching author ${id}: ${res.status}`);
  return res.json();
}

export async function createAuthor(a: Omit<Author, "id">): Promise<Author> {
  const res = await fetch(`/api/authors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(a),
  });
  if (!res.ok) throw new Error(`Error creating author: ${res.status}`);
  return res.json();
}

export async function updateAuthor(
  id: string | number,
  a: Partial<Author>
): Promise<Author> {
  const res = await fetch(`/api/authors/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(a),
  });
  if (!res.ok) throw new Error(`Error updating author: ${res.status}`);
  return res.json();
}

export async function deleteAuthor(id: string | number): Promise<void> {
  const res = await fetch(`/api/authors/${id}`, { method: "DELETE" });

  if (res.status === 412) {
    let msg = "No se puede eliminar el autor por una precondición del servidor.";
    try {
      const payload: unknown = await res.json();
      if (payload && typeof payload === "object" && "apierror" in payload) {
        const apierror = (payload as { apierror?: { message?: string } }).apierror;
        if (apierror?.message) {
          const raw = apierror.message;
          // Traduce mensajes conocidos
          if (/associated books/i.test(raw)) {
            msg = "No se puede eliminar el autor porque tiene libros asociados.";
          } else if (/associated prizes/i.test(raw)) {
            msg = "No se puede eliminar el autor porque tiene premios asociados.";
          } else {
            msg = raw; // deja el texto tal cual si es otro caso
          }
        }
      }
    } catch { /* ignore */ }
    throw new HttpError(412, msg);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DELETE /api/authors/${id} -> ${res.status} ${text}`);
  }
}