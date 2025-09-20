"use client";

import { FormEvent, JSX, useState } from "react";
import { useAuthors } from "@/context/AuthorsContext";
import { useRouter } from "next/navigation";

function AvatarPreview({ src, alt }: { src?: string; alt: string }) {
  const url =
    src && src.startsWith("http")
      ? src
      : src
      ? `/images/${src.replace(/^\/+/, "")}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&background=0D8ABC&color=fff`;
  return (
    // usamos <img> simple para evitar restricciones de domain en next/image
    <img
      src={url}
      alt={alt}
      width={72}
      height={72}
      className="h-18 w-18 rounded-2xl object-cover ring-1 ring-zinc-800"
    />
  );
}

export default function CrearAutorPage(): JSX.Element {
  const { addAuthor } = useAuthors();
  const router = useRouter();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("El nombre es obligatorio");
    setPending(true);
    try {
      await addAuthor({ name, birthDate, image, description });
      router.push("/authors");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`No se pudo crear: ${msg}`);
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="min-h-[70vh] grid place-items-center">
    <div className="w-full max-w-2xl">
      <h1 className="text-xl font-semibold text-center mb-4">Crear autor</h1>


      <form onSubmit={onSubmit} className="card p-6 grid gap-5 w-full">
        {/* Preview + nombre */}
        <div className="flex items-center gap-4">
          <AvatarPreview src={image} alt={name || "Nuevo autor"} />
          <div className="flex-1">
            <div className="label">Nombre</div>
            <input
              className="input"
              placeholder="Gabriel García Márquez"
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
          <p className="mt-1 text-xs text-zinc-500">
            Puedes pegar una URL externa o dejarlo vacío para usar un avatar automático.
          </p>
        </div>

        <div>
          <div className="label">Descripción</div>
          <textarea
            className="input min-h-28"
            placeholder="Autor colombiano, Nobel de Literatura 1982…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "Guardando…" : "Guardar"}
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