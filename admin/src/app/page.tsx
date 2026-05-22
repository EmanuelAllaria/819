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
    <div className="relative flex min-h-screen flex-col bg-app">
      <div className="h-44 bg-primary">
        <div className="mx-auto flex h-full w-full max-w-5xl items-center justify-center px-6">
          <div className="text-center text-white">
            <Image
              src={logo}
              alt="ISI PLAZA"
              priority
              className="mx-auto h-16 w-auto rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-16 w-full max-w-md px-6 pb-12">
        <main className="rounded-3xl border border-black/10 bg-white shadow-card">
          <div className="px-8 pb-7 pt-8">
            <h1 className="text-2xl font-semibold text-ink">Sign In</h1>

            <form onSubmit={onSubmit} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink">Token:</label>
                <input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="enter your token..."
                  minLength={6}
                  maxLength={20}
                  autoComplete="off"
                  className={[
                    "mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none",
                    "border-black/15 focus:border-primary focus:ring-4 focus:ring-accent-soft",
                    showError ? "border-primary" : "",
                  ].join(" ")}
                />
              </div>

              <button
                type="submit"
                disabled={!isValid || isLoading}
                className={[
                  "w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white",
                  "bg-primary hover:bg-primary-bright active:bg-primary",
                  "focus:outline-none focus:ring-4 focus:ring-accent-soft",
                  !isValid || isLoading ? "cursor-not-allowed opacity-70" : "",
                ].join(" ")}
              >
                {isLoading ? "checking..." : "enter panel"}
              </button>

              {serverError ? (
                <div className="text-sm font-semibold text-primary">
                  The token is invalid or inactive.
                </div>
              ) : null}
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
