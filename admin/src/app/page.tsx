"use client";

import { supabase } from "@/lib/supabase";
import logo from "@/assets/logo.jpeg";
import Image from "next/image";
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
  const isValid = normalized.length >= 6 && normalized.length <= 20;
  const showError = touched && !isValid;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setServerError(null);
    if (!isValid) return;

    setIsLoading(true);
    try {
      const res = await supabase
        .from("admin_tokens")
        .select("*")
        .eq("token_value", normalized)
        .limit(1)
        .maybeSingle();

      if (res.error) {
        setServerError("The token is invalid or inactive.");
        return;
      }

      const data = res.data as Record<string, unknown> | null;
      const isInactive = data ? data["is_active"] === false : true;
      if (!data || isInactive) {
        setServerError("The token is invalid or inactive.");
        return;
      }

      sessionStorage.setItem(SESSION_KEY, normalized);
      router.replace("/gestion");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary to-primary-bright" />
      <div className="absolute inset-x-0 top-64 bottom-0 bg-zinc-300" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl justify-center px-6 pt-10 pb-12">
        <main className="w-full max-w-md">
          <div className="flex flex-col items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/85 shadow-card ring-1 ring-black/10">
              <Image src={logo} alt="ISI PLAZA" priority className="h-14 w-auto" />
            </div>
            <div className="mt-3 text-xs tracking-[0.28em] text-white/80">
              ADMIN PANEL
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-black/10 bg-white shadow-card">
            <div className="px-7 pb-7 pt-6">
              <h1 className="text-center text-xl font-semibold text-ink">
                Sign In
              </h1>

              <form onSubmit={onSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-black/70">
                    Token:
                  </label>
                  <input
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="enter your token..."
                    minLength={6}
                    maxLength={20}
                    autoComplete="off"
                    className={[
                      "mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none",
                      "border-black/15 focus:border-primary focus:ring-4 focus:ring-accent-soft",
                      showError ? "border-primary" : "",
                    ].join(" ")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isValid || isLoading}
                  className={[
                    "w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm",
                    "bg-primary hover:bg-primary-bright active:bg-primary",
                    "focus:outline-none focus:ring-4 focus:ring-accent-soft",
                    !isValid || isLoading ? "cursor-not-allowed opacity-70" : "",
                  ].join(" ")}
                >
                  {isLoading ? "checking..." : "enter panel"}
                </button>

                {serverError ? (
                  <div className="text-center text-sm font-semibold text-primary">
                    {serverError}
                  </div>
                ) : null}
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
