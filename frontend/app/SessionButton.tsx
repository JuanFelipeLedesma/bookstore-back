 "use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SessionButton() {
  const [auth, setAuth] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(d => setAuth(Boolean(d.authenticated)))
      .catch(() => setAuth(false));
  }, []);

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
  };

  if (auth === null) return null;
  return auth ? (
    <button className="btn btn-ghost" onClick={logout}>Cerrar sesión</button>
  ) : (
    <Link className="btn btn-ghost" href="/login">Iniciar sesión</Link>
  );
}