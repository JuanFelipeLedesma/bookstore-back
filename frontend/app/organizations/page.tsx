"use client";

import { useEffect, useState } from "react";

type Id = string | number;
type Organization = { id: Id; name: string; description?: string; [k: string]: unknown };

export default function OrganizationsPage() {
  const [items, setItems] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      try {
        const urls = ["/api/organizations"];
        let ok = false;
        let last = "";
        for (const u of urls) {
          const res = await fetch(u, { cache: "no-store" });
          if (res.ok) {
            const data: Organization[] = await res.json();
            setItems(Array.isArray(data) ? data : []);
            ok = true;
            break;
          } else {
            last = `${u} -> ${res.status}`;
          }
        }
        if (!ok) throw new Error(last || "No se pudo cargar organizaciones");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <main className="container-page">Cargando…</main>;
  if (err) return <main className="container-page text-red-400">Error: {err}</main>;

  return (
    <main className="container-page space-y-4">
      <h1 className="text-xl font-semibold">Organizaciones</h1>
      <ul className="grid gap-2">
        {items.map((o) => (
          <li key={String(o.id)} className="rounded-xl bg-zinc-900/60 p-3 ring-1 ring-zinc-800">
            <strong>{o.name}</strong>
            {o.description ? <p className="text-sm text-zinc-400">{o.description}</p> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}