"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function clampToken(raw: string): string {
  return raw.replace(/\s+/g, "");
}

const SESSION_KEY = "admin_token_value";

export default function Home() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) router.replace("/gestion");
  }, [router]);

  const normalized = useMemo(() => clampToken(token), [token]);
  const isValid = normalized.length >= 9 && normalized.length <= 15;
  const showError = touched && !isValid;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setServerError(null);
    if (!isValid) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_tokens")
        .select("id")
        .eq("token_value", normalized)
        .limit(1)
        .maybeSingle();

      if (error) {
        setServerError("Error consultando token. Revisa la conexión.");
        return;
      }
      if (!data) {
        setServerError("Token inválido.");
        return;
      }

      sessionStorage.setItem(SESSION_KEY, normalized);
      router.replace("/gestion");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-paper px-6 py-10">
      <main className="w-full max-w-md rounded-2xl border border-black/10 bg-white shadow-card">
        <div className="flex items-start justify-between gap-6 border-b border-black/10 px-6 py-5">
          <div>
            <div className="text-xs font-semibold tracking-wide text-black/60">
              ADMIN
            </div>
            <h1 className="mt-1 text-lg font-semibold leading-6 text-black">
              Acceso con Token
            </h1>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            <span className="text-sm font-semibold">A</span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="px-6 py-6">
          <label className="block text-sm font-medium text-black">Token</label>
          <div className="mt-2">
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="9 a 15 caracteres"
              minLength={9}
              maxLength={15}
              autoComplete="off"
              className={[
                "w-full rounded-xl border px-3 py-2 text-sm outline-none",
                "border-black/15 focus:border-primary focus:ring-4 focus:ring-accent-soft/40",
                showError ? "border-primary-bright" : "",
              ].join(" ")}
            />
            <div className="mt-2 flex items-center justify-between text-xs text-black/60">
              <span>
                {showError
                  ? "El token debe tener entre 9 y 15 caracteres (sin espacios)."
                  : "Se valida contra Supabase (admin_tokens)."}
              </span>
              <span className={showError ? "text-primary-bright" : ""}>
                {normalized.length}/15
              </span>
            </div>
            {serverError ? (
              <div className="mt-2 text-xs font-semibold text-primary-bright">
                {serverError}
              </div>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className={[
              "mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white",
              "bg-primary hover:bg-primary-bright active:bg-primary",
              "focus:outline-none focus:ring-4 focus:ring-accent-soft/50",
              !isValid ? "cursor-not-allowed opacity-60" : "",
            ].join(" ")}
          >
            {isLoading ? "Validando..." : "Acceder"}
          </button>
        </form>

        <div className="border-t border-black/10 px-6 py-4 text-xs text-black/60">
          <div className="flex items-center justify-between">
            <span>Modo: mock interactivo</span>
            <span className="font-mono">v0</span>
          </div>
        </div>
      </main>
    </div>
  );
}
