"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Id = string | number;

type Prize = {
  id: Id;
  name: string;
  year?: number | string;
  description?: string;
};

type AuthorBrief = { id?: Id; name?: string; fullName?: string };

// Autor con posibles claves para premios
type AuthorDetail = AuthorBrief & {
  prizes?: Prize[];
  awards?: Prize[];
  // permitir campos adicionales sin usar any
  [k: string]: unknown;
};

export default function AuthorPrizesPage() {
  const { id } = useParams<{ id: string }>();
  const authorId = String(id);

  const [authorName, setAuthorName] = useState<string>("");
  const [authorSnap, setAuthorSnap] = useState<AuthorDetail | null>(null);
  const [prizeKey, setPrizeKey] = useState<"prizes" | "awards" | null>(null);

  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [allPrizes, setAllPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | undefined>();
  const [adding, setAdding] = useState<Id | "">("");

  // Carga inicial: autor (con sus premios) + catálogo de premios
  useEffect(() => {
    (async () => {
      try {
        // 1) Traer detalle del autor
        const aRes = await fetch(`/api/authors/${authorId}`, { cache: "no-store" });
        if (!aRes.ok) throw new Error(`GET /authors/${authorId} -> ${aRes.status}`);
        const a: AuthorDetail = await aRes.json();

        setAuthorSnap(a);
        setAuthorName(a.name ?? a.fullName ?? `#${authorId}`);

        const k: "prizes" | "awards" | null =
          Array.isArray(a.prizes) ? "prizes" : Array.isArray(a.awards) ? "awards" : null;
        setPrizeKey(k);
        setPrizes((k ? (a[k] as Prize[]) : []) ?? []);

        // 2) Catálogo de premios (del controlador /prizes)
        const pRes = await fetch(`/api/prizes`, { cache: "no-store" });
        if (!pRes.ok) throw new Error(`GET /prizes -> ${pRes.status}`);
        const catalog: Prize[] = await pRes.json();
        setAllPrizes(catalog);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Error cargando premios");
      } finally {
        setLoading(false);
      }
    })();
  }, [authorId]);

  const available = useMemo(() => {
    const linked = new Set(prizes.map((p) => String(p.id)));
    return allPrizes.filter((p) => !linked.has(String(p.id)));
  }, [prizes, allPrizes]);

  // PUT /authors/:id con el autor completo, actualizando el arreglo de premios
  async function putAuthorWith(newList: Prize[]): Promise<void> {
    if (!authorSnap || !prizeKey) {
      throw new Error("El backend no expone un arreglo 'prizes' ni 'awards' en AuthorDTO.");
    }
    const body: AuthorDetail = { ...authorSnap, [prizeKey]: newList };

    // Evitar mandar el id dentro del body si tu backend no lo espera
    // (muchos controladores lo toman solo por path)
    delete (body as Record<string, unknown>).id;

    const res = await fetch(`/api/authors/${authorId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`PUT /authors/${authorId} -> ${res.status} ${txt}`);
    }
    // Actualizamos el snapshot con lo último que enviamos
    setAuthorSnap(body);
  }

  const unlink = async (prizeId: Id) => {
    if (!confirm("¿Desasociar premio?")) return;
    try {
      const next = prizes.filter((p) => String(p.id) !== String(prizeId));
      await putAuthorWith(next);
      setPrizes(next);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error desasociando premio");
    }
  };

  const link = async () => {
    if (!adding) return;
    try {
      // Tomamos el objeto de catálogo si está, sino al menos un objeto con id
      const found = allPrizes.find((p) => String(p.id) === String(adding));
      const newItem: Prize = found ?? { id: adding, name: String(adding) };
      const next = [...prizes, newItem];
      await putAuthorWith(next);
      setPrizes(next);
      setAdding("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error asociando premio");
    }
  };

  if (loading) return <main className="container-page">Cargando…</main>;
  if (err) return <main className="container-page text-red-400">Error: {err}</main>;

  return (
    <main className="container-page space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Premios de {authorName || `autor #${authorId}`}
        </h1>
      </header>

      <section className="card p-4 space-y-3">
        <h2 className="font-medium">Premios asociados</h2>

        {prizes.length === 0 ? (
          <p className="text-sm text-zinc-400">Este autor no tiene premios aún.</p>
        ) : (
          <ul className="grid gap-2">
            {prizes.map((p) => (
              <li
                key={String(p.id)}
                className="flex items-center justify-between rounded-xl bg-zinc-900/60 p-3 ring-1 ring-zinc-800"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  {p.year ? <div className="text-xs text-zinc-400">Año: {p.year}</div> : null}
                  {p.description ? (
                    <div className="text-xs text-zinc-400 line-clamp-2">{p.description}</div>
                  ) : null}
                </div>
                <button className="btn btn-danger px-3 py-1.5 text-xs" onClick={() => unlink(p.id)}>
                  Desasociar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-4 space-y-3">
        <h2 className="font-medium">Asociar premio</h2>
        {available.length === 0 ? (
          <p className="text-sm text-zinc-400">No hay premios disponibles para asociar.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="input max-w-xs"
              value={adding}
              onChange={(e) => setAdding(e.target.value)}
            >
              <option value="">Selecciona un premio…</option>
              {available.map((p) => (
                <option key={String(p.id)} value={String(p.id)}>
                  {p.name} {p.year ? `(${p.year})` : ""}
                </option>
              ))}
            </select>
            <button disabled={!adding} className="btn btn-primary" onClick={link}>
              Asociar
            </button>
          </div>
        )}
      </section>
    </main>
  );
}