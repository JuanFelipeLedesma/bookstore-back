"use client";

import { FormEvent, JSX, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthors } from "@/context/AuthorsContext";
import type { Author } from "@/types/author";
import { fetchAuthor } from "@/lib/api";

function AvatarPreview({ src, alt }: { src?: string; alt: string }) {
  const url =
    src && src.startsWith("http")
      ? src
      : src
      ? `/images/${src.replace(/^\/+/, "")}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&background=0D8ABC&color=fff`;
  return (
    <img
      src={url}
      alt={alt}
      width={72}
      height={72}
      className="h-18 w-18 rounded-2xl object-cover ring-1 ring-zinc-800"
    />
  );
}

export default function EditAutorPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? "");
  const { authors, loading, error, editAuthor } = useAuthors();

  const fromCtx: Author | undefined = useMemo(
    () => authors.find((a) => String(a.id) === id),
    [authors, id]
  );

  const [current, setCurrent] = useState<Author | undefined>(fromCtx);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setCurrent(fromCtx);
    if (!fromCtx && id) {
      fetchAuthor(id).then(setCurrent).catch(() => {});
    }
  }, [fromCtx, id]);

  const [name, setName] = useState(current?.name ?? "");
  const [birthDate, setBirthDate] = useState(current?.birthDate ?? "");
  const [image, setImage] = useState(current?.image ?? "");
  const [description, setDescription] = useState(current?.description ?? "");

  useEffect(() => {
    if (!current) return;
    setName(current.name ?? "");
    setBirthDate(current.birthDate ?? "");
    setImage(current.image ?? "");
    setDescription(current.description ?? "");
  }, [current]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      await editAuthor(id, { name, birthDate, image, description });
      router.push("/authors");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`No se pudo guardar: ${msg}`);
    } finally {
      setPending(false);
    }
  };

  if (loading && !current) return <p className="text-zinc-400">Cargando…</p>;
  if (error) return <p className="text-red-400">Error: {error}</p>;
  if (!current) return <p className="text-zinc-400">No se encontró el autor.</p>;

  return (
    <section className="min-h-[70vh] grid place-items-center">
    <div className="w-full max-w-2xl">
      <h1 className="text-xl font-semibold text-center mb-4">Editar autor</h1>

      <form onSubmit={onSubmit} className="card p-6 grid gap-5 w-full">
        <div className="flex items-center gap-4">
          <AvatarPreview src={image} alt={name || "Autor"} />
          <div className="flex-1">
            <div className="label">Nombre</div>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <div className="label">Fecha de nacimiento</div>
          <input
            className="input"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            required
          />
        </div>

        <div>
          <div className="label">URL imagen</div>
          <input
            className="input"
            placeholder="https://..."
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
        </div>

        <div>
          <div className="label">Descripción</div>
          <textarea
            className="input min-h-28"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "Guardando…" : "Guardar cambios"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
            Cancelar
          </button>
        </div>
      </form>
      </div>
    </section>
  );
}