"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useRef, useState } from "react";

type BuyerRow = {
  id: string;
  email: string;
  created_at: string;
};

type WholesalerRow = {
  id: string;
  email: string;
  nombre: string | null;
  acceso: boolean;
  fecha_aprobacion: string | null;
  verificado: boolean;
  promo_activa: boolean;
  created_at: string;
};

function Card({
  title,
  accent,
  children,
}: {
  title: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-black/10 bg-white shadow-card">
      <div className="border-b border-black/10 px-6 py-5">
        <h2 className={["text-sm font-semibold", accent ? "text-primary" : "text-ink"].join(" ")}>
          {title}
        </h2>
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

function inputBaseClass(error?: boolean): string {
  return [
    "w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none",
    "border-black/15 focus:border-primary focus:ring-4 focus:ring-accent-soft",
    error ? "border-primary" : "",
  ].join(" ");
}

function badgeBaseClass(kind: "ok" | "warn" | "muted") {
  if (kind === "ok") return "bg-primary/10 text-primary border-primary/20";
  if (kind === "warn") return "bg-amber-500/10 text-amber-700 border-amber-500/20";
  return "bg-black/5 text-black/60 border-black/10";
}

function computeCountdown(fechaAprobacionIso: string | null, acceso: boolean) {
  if (!acceso || !fechaAprobacionIso) return null;
  const start = new Date(fechaAprobacionIso);
  const exp = new Date(start);
  exp.setDate(exp.getDate() + 30);
  const now = new Date();
  const msLeft = exp.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
  return { daysLeft, expiresAt: exp };
}

function fileExtFromType(contentType: string | undefined): string {
  const t = (contentType ?? "").toLowerCase();
  if (t.includes("png")) return "png";
  if (t.includes("webp")) return "webp";
  if (t.includes("gif")) return "gif";
  if (t.includes("jpeg") || t.includes("jpg")) return "jpg";
  return "bin";
}

export default function GestionPage() {
  const [buyers, setBuyers] = useState<BuyerRow[]>([]);
  const [wholesalers, setWholesalers] = useState<WholesalerRow[]>([]);
  const [buyersLoading, setBuyersLoading] = useState(true);
  const [wholesalersLoading, setWholesalersLoading] = useState(true);
  const [totals, setTotals] = useState<{ buyers: number; wholesalers: number }>({ buyers: 0, wholesalers: 0 });
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  async function refresh() {
    setBuyersLoading(true);
    setWholesalersLoading(true);
    const [buyersRes, wholesalersRes, buyersCount, wholesalersCount] = await Promise.all([
      supabase.from("buyers").select("id,email,created_at").order("created_at", { ascending: false }).limit(200),
      supabase
        .from("wholesaler_profiles")
        .select("id,email,nombre,acceso,fecha_aprobacion,verificado,promo_activa,created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("buyers").select("id", { count: "exact", head: true }),
      supabase.from("wholesaler_profiles").select("id", { count: "exact", head: true }),
    ]);

    setBuyers((buyersRes.data ?? []) as BuyerRow[]);
    setWholesalers((wholesalersRes.data ?? []) as WholesalerRow[]);
    setTotals({ buyers: buyersCount.count ?? 0, wholesalers: wholesalersCount.count ?? 0 });
    setBuyersLoading(false);
    setWholesalersLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const showBuyers = useMemo(() => buyers, [buyers]);
  const showWholesalers = useMemo(() => wholesalers, [wholesalers]);

  async function deleteBuyer(id: string) {
    setActionBusyId(id);
    try {
      await supabase.from("buyers").delete().eq("id", id);
      await refresh();
    } finally {
      setActionBusyId(null);
    }
  }

  async function deleteWholesaler(id: string) {
    setActionBusyId(id);
    try {
      await supabase.from("wholesaler_profiles").delete().eq("id", id);
      await refresh();
    } finally {
      setActionBusyId(null);
    }
  }

  async function toggleWholesalerFlag(id: string, patch: Partial<WholesalerRow>) {
    setActionBusyId(id);
    try {
      await supabase.from("wholesaler_profiles").update(patch).eq("id", id);
      await refresh();
    } finally {
      setActionBusyId(null);
    }
  }

  async function setWholesalerAccess(id: string, enable: boolean) {
    setActionBusyId(id);
    try {
      if (enable) {
        await supabase.rpc("grant_wholesaler_access", { wholesaler_id: id });
      } else {
        await supabase.from("wholesaler_profiles").update({ acceso: false, fecha_aprobacion: null }).eq("id", id);
      }
      await refresh();
    } finally {
      setActionBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="MÉTRICAS" accent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-5 py-5">
              <div className="text-xs font-semibold text-black/60">Total compradores</div>
              <div className="mt-2 text-3xl font-semibold text-primary">{totals.buyers}</div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-5 py-5">
              <div className="text-xs font-semibold text-black/60">Total mayoristas</div>
              <div className="mt-2 text-3xl font-semibold text-primary">{totals.wholesalers}</div>
            </div>
          </div>
        </Card>
        <Card title="ACCIONES" accent>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-bright focus:outline-none focus:ring-4 focus:ring-accent-soft"
          >
            Actualizar
          </button>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="COMPRADORES (APP 1)" accent>
          {buyersLoading ? (
            <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-5 py-6 text-sm text-black/60">
              Cargando...
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-black/10">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-black/[0.02] text-left text-xs font-semibold text-black/60">
                    <th className="border-b border-black/10 px-5 py-3">Mail</th>
                    <th className="border-b border-black/10 px-5 py-3">Eliminar</th>
                  </tr>
                </thead>
                <tbody>
                  {showBuyers.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-5 py-10 text-center">
                        <div className="text-6xl font-semibold text-primary">0</div>
                        <div className="mt-3 text-sm text-black/60">No hay compradores registrados.</div>
                      </td>
                    </tr>
                  ) : (
                    showBuyers.map((r) => (
                      <tr key={r.id} className="text-sm text-ink">
                        <td className="border-b border-black/10 px-5 py-4 text-black/70">{r.email}</td>
                        <td className="border-b border-black/10 px-5 py-4">
                          <button
                            type="button"
                            disabled={actionBusyId === r.id}
                            onClick={() => void deleteBuyer(r.id)}
                            className={[
                              "rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-accent-soft",
                              "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10",
                              actionBusyId === r.id ? "cursor-not-allowed opacity-70" : "",
                            ].join(" ")}
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
          )}
        </Card>

        <Card title="MAYORISTAS (APP 2)" accent>
          {wholesalersLoading ? (
            <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-5 py-6 text-sm text-black/60">
              Cargando...
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-black/10">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-black/[0.02] text-left text-xs font-semibold text-black/60">
                    <th className="border-b border-black/10 px-5 py-3">Usuario</th>
                    <th className="border-b border-black/10 px-5 py-3">Mail</th>
                    <th className="border-b border-black/10 px-5 py-3">Contraseña</th>
                    <th className="border-b border-black/10 px-5 py-3">Acceso</th>
                    <th className="border-b border-black/10 px-5 py-3">Cuenta regresiva</th>
                    <th className="border-b border-black/10 px-5 py-3">Verificado</th>
                    <th className="border-b border-black/10 px-5 py-3">Promo Activa</th>
                    <th className="border-b border-black/10 px-5 py-3">Eliminar</th>
                  </tr>
                </thead>
                <tbody>
                  {showWholesalers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center">
                        <div className="text-6xl font-semibold text-primary">0</div>
                        <div className="mt-3 text-sm text-black/60">No hay mayoristas registrados.</div>
                      </td>
                    </tr>
                  ) : (
                    showWholesalers.map((w) => {
                      const label = w.nombre?.trim().length ? w.nombre : w.id;
                      const countdown = computeCountdown(w.fecha_aprobacion, w.acceso);
                      const badge =
                        !w.acceso
                          ? { text: "Denegado", kind: "muted" as const }
                          : countdown && countdown.daysLeft > 0
                            ? { text: `${countdown.daysLeft} días`, kind: "ok" as const }
                            : { text: "Vencido", kind: "warn" as const };
                      return (
                        <tr key={w.id} className="text-sm text-ink">
                          <td className="border-b border-black/10 px-5 py-4 font-semibold">{label}</td>
                          <td className="border-b border-black/10 px-5 py-4 text-black/70">{w.email}</td>
                          <td className="border-b border-black/10 px-5 py-4 text-black/40">—</td>
                          <td className="border-b border-black/10 px-5 py-4">
                            <button
                              type="button"
                              disabled={actionBusyId === w.id}
                              onClick={() => void setWholesalerAccess(w.id, !w.acceso)}
                              className={[
                                "rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-accent-soft",
                                w.acceso ? "border-black/10 bg-white text-black/70 hover:bg-black/[0.03]" : "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10",
                                actionBusyId === w.id ? "cursor-not-allowed opacity-70" : "",
                              ].join(" ")}
                            >
                              {w.acceso ? "Denegar" : "Activar"}
                            </button>
                          </td>
                          <td className="border-b border-black/10 px-5 py-4">
                            <span
                              className={[
                                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                                badgeBaseClass(badge.kind),
                              ].join(" ")}
                              title={
                                countdown
                                  ? `Vence el ${countdown.expiresAt.toLocaleDateString()}`
                                  : "Sin aprobación aún"
                              }
                            >
                              {badge.text}
                            </span>
                          </td>
                          <td className="border-b border-black/10 px-5 py-4">
                            <button
                              type="button"
                              disabled={actionBusyId === w.id}
                              onClick={() => void toggleWholesalerFlag(w.id, { verificado: !w.verificado })}
                              className={[
                                "rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-accent-soft",
                                w.verificado ? "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10" : "border-black/10 bg-white text-black/70 hover:bg-black/[0.03]",
                                actionBusyId === w.id ? "cursor-not-allowed opacity-70" : "",
                              ].join(" ")}
                            >
                              {w.verificado ? "Sí" : "No"}
                            </button>
                          </td>
                          <td className="border-b border-black/10 px-5 py-4">
                            <button
                              type="button"
                              disabled={actionBusyId === w.id}
                              onClick={() => void toggleWholesalerFlag(w.id, { promo_activa: !w.promo_activa })}
                              className={[
                                "rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-accent-soft",
                                w.promo_activa ? "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10" : "border-black/10 bg-white text-black/70 hover:bg-black/[0.03]",
                                actionBusyId === w.id ? "cursor-not-allowed opacity-70" : "",
                              ].join(" ")}
                            >
                              {w.promo_activa ? "Sí" : "No"}
                            </button>
                          </td>
                          <td className="border-b border-black/10 px-5 py-4">
                            <button
                              type="button"
                              disabled={actionBusyId === w.id}
                              onClick={() => void deleteWholesaler(w.id)}
                              className={[
                                "rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-accent-soft",
                                "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10",
                                actionBusyId === w.id ? "cursor-not-allowed opacity-70" : "",
                              ].join(" ")}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <CarouselFormCard />
    </div>
  );
}

function CarouselFormCard() {
  const [order, setOrder] = useState<number>(1);
  const [active, setActive] = useState(true);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const valid = file !== null && Number.isFinite(order) && order >= 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setSubmitError(null);
    setSuccess(false);
    if (!valid || !file) return;

    setIsSubmitting(true);
    try {
      const ext = fileExtFromType(file.type);
      const path = `carousel-app1/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const upload = await supabase.storage.from("banners").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });

      if (upload.error) {
        setSubmitError("No se pudo subir la imagen.");
        return;
      }

      const publicUrl = supabase.storage.from("banners").getPublicUrl(path).data.publicUrl;

      const payload = {
        url_imagen: publicUrl,
        link_destino: redirectUrl.trim().length ? redirectUrl.trim() : null,
        orden: order,
        activo: active,
      };

      const primaryInsert = await supabase.from("banners").insert(payload);
      if (primaryInsert.error) {
        setSubmitError("No se pudo insertar el banner.");
        return;
      }

      setOrder(1);
      setActive(true);
      setRedirectUrl("");
      setFile(null);
      setTouched(false);
      setSuccess(true);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card title="BANNERS - CAROUSEL APP 1" accent>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-4">
            <label className="block text-sm font-medium text-ink">Imagen</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setSubmitError(null);
                setSuccess(false);
                const next = e.target.files?.[0] ?? null;
                setFile(next);
                if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = next ? URL.createObjectURL(next) : null;
              }}
              onBlur={() => setTouched(true)}
              className={[
                "mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 text-sm text-black file:mr-3 file:rounded-xl file:border-0 file:bg-black/5 file:px-3 file:py-1.5 file:text-sm file:font-semibold hover:bg-black/[0.02]",
                touched && !file ? "border-primary" : "",
              ].join(" ")}
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-ink">Orden</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              onBlur={() => setTouched(true)}
              className={["mt-2", inputBaseClass(touched && !Number.isFinite(order))].join(" ")}
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-ink">Activo</label>
            <label className="mt-2 flex items-center gap-3 rounded-2xl border border-black/15 bg-white px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <span className="font-medium text-black/70">Activo</span>
            </label>
          </div>

          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-ink">URL (opcional)</label>
            <input
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              placeholder="https://..."
              className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-accent-soft"
            />
          </div>

          <div className="lg:col-span-1 lg:flex lg:justify-end">
            <button
              type="submit"
              disabled={!valid || isSubmitting}
              className={[
                "w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white lg:w-auto",
                "bg-primary hover:bg-primary-bright active:bg-primary",
                "focus:outline-none focus:ring-4 focus:ring-accent-soft",
                !valid || isSubmitting ? "cursor-not-allowed opacity-70" : "",
              ].join(" ")}
            >
              {isSubmitting ? "Subiendo..." : "Subir al carousel"}
            </button>
          </div>
        </div>

        {submitError ? (
          <div className="text-sm font-semibold text-primary">{submitError}</div>
        ) : success ? (
          <div className="text-sm font-semibold text-green-600">Subido correctamente.</div>
        ) : null}
      </form>
    </Card>
  );
}
