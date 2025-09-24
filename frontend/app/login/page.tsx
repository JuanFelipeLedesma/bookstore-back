"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const LoginSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  remember: z.boolean().optional(),
});
type LoginForm = z.infer<typeof LoginSchema>;

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) { /* …igual que antes… */ return (
  <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.7 6 29.1 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11.1 0 20-8.9 20-20 0-1.3-.1-2.7-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.3 18.9 14 24 14c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.7 6 29.1 4 24 4 16.2 4 9.6 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.3-5.3l-6.1-5c-2 1.6-4.7 2.6-7.2 2.6-5.3 0-9.8-3.4-11.5-8.1l-6.3 4.9C9.4 39.7 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.3-3.8 5.7-7.3 6.6l6.1 5C37.7 37.6 40 31.4 40 24c0-1.3-.1-2.7-.4-3.5z"/>
  </svg>
); }
function FacebookIcon(props: React.SVGProps<SVGSVGElement>) { /* …igual… */ return (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path fill="#1877F2" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.094 4.388 23.093 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.007 1.792-4.668 4.533-4.668 1.313 0 2.686.235 2.686.235v2.953h-1.514c-1.493 0-1.957.93-1.957 1.882v2.259h3.328l-.532 3.49h-2.796V24C19.612 23.093 24 18.094 24 12.073z"/>
  </svg>
); }

function SocialButton({ onClick, brand, children }:{
  onClick: () => void; brand: "google" | "facebook"; children: React.ReactNode;
}) {
  const base = "btn w-full justify-center py-2.5";
  const klass = brand === "google"
    ? "bg-white text-zinc-900 hover:bg-zinc-100 ring-1 ring-zinc-300"
    : "bg-[#1877F2] hover:bg-[#1365cf] text-white";
  const Icon = brand === "google" ? GoogleIcon : FacebookIcon;
  return (
    <button type="button" onClick={onClick} className={`${base} ${klass}`}>
      <Icon className="h-5 w-5" /><span className="ml-2">{children}</span>
    </button>
  );
}

export default function LoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<LoginForm>({ resolver: zodResolver(LoginSchema) });

  // si ya hay sesión, opcionalmente redirigir
  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then((d) => {
      if (d.authenticated) router.replace(next);
    });
  }, [next, router]);

  const onSubmit = handleSubmit(async (data) => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j?.error ?? "No se pudo iniciar sesión");
      return;
    }
    router.replace(next);
  });

  return (
    <section className="min-h-[75vh] grid place-items-center">
      <div className="w-full max-w-md">
        <div className="card p-6 md:p-7">
          <header className="mb-5">
            <h1 className="text-xl font-semibold text-center">Inicia sesión</h1>
            <p className="mt-1 text-center text-sm text-zinc-400">
              Correo válido y contraseña de <strong>mínimo 8</strong> caracteres.
            </p>
          </header>

          <div className="grid gap-2">
            <SocialButton brand="google" onClick={() => alert("Google OAuth (demo)")}>
              Continuar con Google
            </SocialButton>
            <SocialButton brand="facebook" onClick={() => alert("Facebook OAuth (demo)")}>
              Continuar con Facebook
            </SocialButton>
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-zinc-500">
            <div className="h-px flex-1 bg-zinc-800" /><span>o con correo</span><div className="h-px flex-1 bg-zinc-800" />
          </div>

          <form onSubmit={onSubmit} className="grid gap-4">
            <div>
              <div className="label">Correo</div>
              <input className="input" type="email" autoComplete="email"
                placeholder="tucorreo@uniandes.edu.co" {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <div className="label">Contraseña</div>
              <div className="relative">
                <input className="input pr-24" placeholder="••••••••"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password" {...register("password")} />
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800">
                  {showPwd ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" className="accent-brand-600" {...register("remember")} />
              Recordarme
            </label>

            <button className="btn btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? "Ingresando…" : "Entrar"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-zinc-500">
            ¿Problemas? Contacta a camilo xd.
          </p>
        </div>
      </div>
    </section>
  );
}