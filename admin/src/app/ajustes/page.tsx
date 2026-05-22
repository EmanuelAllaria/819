"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";

type TokenRow = {
  id: string;
  description: string | null;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string | null;
};

function randomToken(len: number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => alphabet[b % alphabet.length]).join("");
}

function inputBaseClass(error?: boolean): string {
  return [
    "w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none",
    "border-black/15 focus:border-primary focus:ring-4 focus:ring-accent-soft",
    error ? "border-primary" : "",
  ].join(" ");
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-black/10 bg-white shadow-card">
      <div className="border-b border-black/10 px-6 py-5">
        <h2 className="text-sm font-semibold text-primary">{title}</h2>
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

function Modal({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 py-8">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-full max-w-lg rounded-3xl border border-black/10 bg-white p-7 shadow-card">
        {children}
      </div>
    </div>
  );
}

export default function AjustesPage() {
  const [rows, setRows] = useState<TokenRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formDescription, setFormDescription] = useState("");
  const [formToken, setFormToken] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const tokenValue = useMemo(() => formToken.replace(/\s+/g, ""), [formToken]);
  const tokenValid = tokenValue.length >= 6 && tokenValue.length <= 20;

  async function fetchTokens() {
    setIsLoading(true);

    const res = await supabase.from("admin_tokens").select("*").order("created_at", { ascending: false });

    if (res.error) {
      setRows([]);
      setIsLoading(false);
      return;
    }

    const mapped = (res.data ?? []).map((r: unknown, idx: number) => {
      const row = r as Record<string, unknown>;
      return {
        id: String(row.id ?? idx),
        description: row.description ? String(row.description) : null,
        is_active: row.is_active === false ? false : true,
        last_used_at: row.last_used_at ? String(row.last_used_at) : null,
        created_at: row.created_at ? String(row.created_at) : null,
      };
    });
    setRows(mapped);
    setIsLoading(false);
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetchTokens();
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  async function onCreateToken() {
    setTouched(true);
    setSubmitError(null);

    const finalToken = tokenValue.length ? tokenValue : randomToken(12);
    const finalValid = finalToken.length >= 6 && finalToken.length <= 20;
    if (!finalValid) return;

    setIsCreating(true);
    try {
      const insert = await supabase
        .from("admin_tokens")
        .insert({ token_value: finalToken })
        .select("*")
        .maybeSingle();

      if (insert.error || !insert.data) {
        setSubmitError("No se pudo crear el token.");
        return;
      }

      const inserted = insert.data as Record<string, unknown>;
      const insertedId = inserted.id ? String(inserted.id) : null;
      const desc = formDescription.trim().length ? formDescription.trim() : null;

      if (insertedId && desc) {
        const upd = await supabase.from("admin_tokens").update({ description: desc }).eq("id", insertedId);
        if (upd.error && String(upd.error.code ?? "") !== "PGRST204") {
          const msg = String(upd.error.message ?? "").toLowerCase();
          if (!msg.includes("could not find the 'description' column")) {
            setSubmitError("El token se creó, pero no se pudo guardar la descripción.");
          }
        }
      }

      if (insertedId) {
        const upd = await supabase.from("admin_tokens").update({ is_active: true }).eq("id", insertedId);
        if (upd.error && String(upd.error.code ?? "") !== "PGRST204") {
          const msg = String(upd.error.message ?? "").toLowerCase();
          if (!msg.includes("could not find the 'is_active' column")) {
            setSubmitError("El token se creó, pero no se pudo marcar como activo.");
          }
        }
      }

      setCreatedToken(finalToken);
      setFormDescription("");
      setFormToken("");
      setTouched(false);
      await fetchTokens();
    } finally {
      setIsCreating(false);
    }
  }

  async function onDeleteToken(id: string) {
    const ok = window.confirm("¿Eliminar este token?");
    if (!ok) return;

    const del = await supabase.from("admin_tokens").delete().eq("id", id);
    if (!del.error) await fetchTokens();
  }

  async function onCopy(token: string) {
    try {
      await navigator.clipboard.writeText(token);
    } catch {
      const el = document.createElement("textarea");
      el.value = token;
      el.style.position = "fixed";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  }

  return (
    <div className="space-y-6">
      <Card title="AÑADIR TOKEN (6-20 CARACTERES)">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-5">
            <label className="block text-sm font-medium text-ink">Descripción</label>
            <input
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Ej: acceso recepcion..."
              className={["mt-2", inputBaseClass()].join(" ")}
            />
          </div>

          <div className="lg:col-span-5">
            <label className="block text-sm font-medium text-ink">Token</label>
            <input
              value={formToken}
              onChange={(e) => setFormToken(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="(vacío = auto)"
              className={["mt-2", inputBaseClass(touched && formToken.length > 0 && !tokenValid)].join(" ")}
            />
          </div>

          <div className="lg:col-span-2 lg:flex lg:justify-end">
            <button
              type="button"
              onClick={onCreateToken}
              disabled={isCreating || (formToken.length > 0 && !tokenValid)}
              className={[
                "w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white lg:w-auto",
                "bg-primary hover:bg-primary-bright active:bg-primary",
                "focus:outline-none focus:ring-4 focus:ring-accent-soft",
                isCreating || (formToken.length > 0 && !tokenValid) ? "cursor-not-allowed opacity-70" : "",
              ].join(" ")}
            >
              {isCreating ? "Creando..." : "Generar token"}
            </button>
          </div>
        </div>

        {submitError ? <div className="mt-4 text-sm font-semibold text-primary">{submitError}</div> : null}
      </Card>

      <section className="rounded-3xl border border-black/10 bg-white shadow-card">
        <div className="border-b border-black/10 px-6 py-5">
          <h2 className="text-sm font-semibold text-ink">Tokens</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-0">
            <thead>
              <tr className="bg-black/[0.02] text-left text-xs font-semibold text-black/60">
                <th className="border-b border-black/10 px-6 py-3">ID</th>
                <th className="border-b border-black/10 px-6 py-3">Descripción</th>
                <th className="border-b border-black/10 px-6 py-3">Activo</th>
                <th className="border-b border-black/10 px-6 py-3">Último uso</th>
                <th className="border-b border-black/10 px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-sm text-black/60">
                    Cargando...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-black/60">
                    No hay tokens.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="text-sm text-ink">
                    <td className="border-b border-black/10 px-6 py-4 font-mono text-xs text-black/70">
                      {r.id}
                    </td>
                    <td className="border-b border-black/10 px-6 py-4 text-black/70">
                      {r.description ?? "—"}
                    </td>
                    <td className="border-b border-black/10 px-6 py-4">
                      {r.is_active ? (
                        <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          SÍ
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-black/60">
                          NO
                        </span>
                      )}
                    </td>
                    <td className="border-b border-black/10 px-6 py-4 text-black/70">
                      {r.last_used_at ? new Date(r.last_used_at).toLocaleString() : "—"}
                    </td>
                    <td className="border-b border-black/10 px-6 py-4">
                      <button
                        type="button"
                        onClick={() => onDeleteToken(r.id)}
                        className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-bright focus:outline-none focus:ring-4 focus:ring-accent-soft"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={createdToken !== null}>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-green-700">
              <path
                d="M20 6 9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-lg font-semibold text-ink">Token created</div>
            <div className="mt-1 text-sm text-black/60">
              Token created. Copy this token now, it will not be shown again.
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-black/10 bg-black/[0.02] px-4 py-3 font-mono text-sm text-ink">
          {createdToken ?? ""}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              if (createdToken) onCopy(createdToken);
            }}
            className="rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200"
          >
            Copy to clipboard
          </button>
          <button
            type="button"
            onClick={() => setCreatedToken(null)}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black/70 hover:bg-black/[0.03] focus:outline-none focus:ring-4 focus:ring-accent-soft"
          >
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
}
