"use client";

import { createContext, JSX, useContext, useEffect, useState, type ReactNode } from "react";
import type { Author } from "@/types/author";
import { fetchAuthors, createAuthor, updateAuthor, deleteAuthor, HttpError } from "@/lib/api";
import { fetchBooksByAuthor, deleteBook, unlinkBookFromAuthorStrong  } from "@/lib/books";
import { fetchBooksByAuthorStrict, removeBookFromAuthor } from "@/lib/books";
import { fetchPrizesByAuthor, removeAuthorFromPrize } from "@/lib/prizes";




type AuthorsCtx = {
  authors: Author[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addAuthor: (a: Omit<Author, "id">) => Promise<void>;
  editAuthor: (id: string | number, a: Partial<Author>) => Promise<void>;
  removeAuthor: (id: string | number) => Promise<void>;
};

const AuthorsContext = createContext<AuthorsCtx | undefined>(undefined);

export function AuthorsProvider({ children }: { children: ReactNode }): JSX.Element {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAuthors();
      setAuthors(data);
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const addAuthor = async (a: Omit<Author, "id">): Promise<void> => {
    const created = await createAuthor(a);
    setAuthors(prev => [created, ...prev]);
  };

  const editAuthor = async (id: string | number, a: Partial<Author>): Promise<void> => {
    const updated = await updateAuthor(id, a);
    setAuthors(prev => prev.map(x => (String(x.id) === String(id) ? updated : x)));
  };

const removeAuthor = async (id: string | number): Promise<void> => {
  try {
    // Intento directo
    await deleteAuthor(id);
    setAuthors(prev => prev.filter(x => String(x.id) !== String(id)));
    return;
  } catch (e: unknown) {
    // Si no es 412, mostrar y salir
    if (!(e instanceof HttpError) || e.status !== 412) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(msg);
      return;
    }

    // 412: desasociar libros y premios y reintentar
    const [books, prizes] = await Promise.all([
      fetchBooksByAuthorStrict(id).catch(() => []),
      fetchPrizesByAuthor(id).catch(() => []),
    ]);

    const ok = confirm(
      `${e.message}\n\n` +
      `Se encontraron ${books.length} libro(s) y ${prizes.length} premio(s) asociados.\n` +
      `¿Quieres desasociarlos automáticamente y luego eliminar al autor?`
    );
    if (!ok) return;

    // 1) Quitar relación con cada libro
    for (const b of books) {
      await removeBookFromAuthor(id, b.id);
    }

    // 2) Quitar relación con cada premio
    for (const p of prizes) {
      await removeAuthorFromPrize(p.id);
    }
    
    // 3) Reintentar borrar al autor (y atrapar cualquier error restante)
    try {
      await deleteAuthor(id);
      setAuthors(prev => prev.filter(x => String(x.id) !== String(id)));
    } catch (e2: unknown) {
      const msg = e2 instanceof Error ? e2.message : String(e2);
      alert(msg);
    }
  }
};
  return (
    <AuthorsContext.Provider
      value={{ authors, loading, error, refresh, addAuthor, editAuthor, removeAuthor }}
    >
      {children}
    </AuthorsContext.Provider>
  );
}

export function useAuthors(): AuthorsCtx {
  const ctx = useContext(AuthorsContext);
  if (!ctx) throw new Error("useAuthors must be used within AuthorsProvider");
  return ctx;
}