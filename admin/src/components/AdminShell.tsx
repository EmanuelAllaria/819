"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const SESSION_KEY = "admin_token_value";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatLocalISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatHeaderDate(d: Date): string {
  const weekday = new Intl.DateTimeFormat("es-ES", { weekday: "long" }).format(d);
  const capitalized = weekday.length > 0 ? `${weekday[0].toUpperCase()}${weekday.slice(1)}` : weekday;
  return `${capitalized}, ${formatLocalISODate(d)}`;
}

function IconDatabase({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={active ? "text-primary" : "text-black/50"}
    >
      <path
        d="M12 3c5 0 9 1.34 9 3s-4 3-9 3-9-1.34-9-3 4-3 9-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M3 7v5c0 1.66 4 3 9 3s9-1.34 9-3V7"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M3 12v5c0 1.66 4 3 9 3s9-1.34 9-3v-5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconKey({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={active ? "text-primary" : "text-black/50"}
    >
      <path
        d="M7.5 14.5a5 5 0 1 1 4.8-6.3L21 7v4l-2 2v2h-2v2h-2l-2.2-2.2a5 5 0 0 1-5.3-.3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M7.5 10.5h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authStatus, setAuthStatus] = useState<"loading" | "ok" | "error">("loading");

  const dateLabel = useMemo(() => formatHeaderDate(new Date()), []);

  const nav = useMemo(
    () => [
      { href: "/gestion", label: "Gestión de datos", icon: IconDatabase },
      { href: "/ajustes", label: "Ajustes de acceso", icon: IconKey },
    ],
    [],
  );

  useEffect(() => {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (!existing) {
      router.replace("/");
      return;
    }

    let cancelled = false;
    (async () => {
      setAuthStatus("loading");

      const res = await supabase
        .from("admin_tokens")
        .select("*")
        .eq("token_value", existing)
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      const data = (res.data ?? null) as Record<string, unknown> | null;
      const isInactive = data ? data["is_active"] === false : true;

      if (res.error || !data || isInactive) {
        sessionStorage.removeItem(SESSION_KEY);
        router.replace("/");
        return;
      }

      setAuthStatus("ok");
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function onLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    router.replace("/");
  }

  const activeHref = nav.find((n) => pathname === n.href)?.href ?? null;

  return (
    <div className="flex min-h-screen bg-app">
      <aside className="flex w-[280px] flex-col border-r border-black/10 bg-white">
        <div className="px-6 pb-5 pt-6">
          <div className="text-lg font-semibold tracking-wide text-primary">ISI PLAZA</div>
          <div className="mt-1 text-xs tracking-[0.22em] text-black/45">ADMIN PANEL</div>
        </div>

        <nav className="px-4">
          <div className="space-y-1">
            {nav.map((item) => {
              const active = activeHref === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold outline-none",
                    "transition-colors hover:bg-black/[0.03] focus-visible:ring-4 focus-visible:ring-accent-soft",
                    active ? "bg-primary/5 text-primary" : "text-black/70",
                  ].join(" ")}
                >
                  <Icon active={active} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="mt-auto px-4 pb-5">
          <button
            type="button"
            onClick={onLogout}
            className={[
              "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black/70",
              "hover:bg-black/[0.03] focus:outline-none focus:ring-4 focus:ring-accent-soft",
            ].join(" ")}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-black/10 bg-white">
          <div className="flex items-center justify-between gap-4 px-8 py-5">
            <h1 className="text-lg font-semibold text-ink">{title}</h1>
            <div className="text-sm font-medium text-black/60">{dateLabel}</div>
          </div>
        </header>

        <main className="flex-1 px-8 py-7">
          {authStatus === "loading" ? (
            <div className="rounded-3xl border border-black/10 bg-white px-6 py-6 text-sm text-black/60 shadow-card">
              Validando token...
            </div>
          ) : authStatus === "error" ? (
            <div className="rounded-3xl border border-black/10 bg-white px-6 py-6 text-sm text-primary shadow-card">
              The token is invalid or inactive.
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
