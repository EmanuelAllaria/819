"use client";

import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TabKey = "banners" | "mayoristas";

const SESSION_KEY = "admin_token_value";

type BannerRow = {
  id: string;
  image_url: string;
  redirect_url: string | null;
  is_active: boolean;
  created_at: string;
};

type WholesalerRow = {
  id: string;
  email: string;
  company_name: string | null;
  is_verified: boolean;
  access_granted_at: string | null;
  access_expires_at: string | null;
  created_at: string;
};

function daysBetween(now: Date, future: Date): number {
  const ms = future.getTime() - now.getTime();
  const days = ms / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(days));
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function accessProgress(now: Date, expiresAt: Date): { daysLeft: number; ratioLeft: number } {
  const totalDays = 30;
  const daysLeft = daysBetween(now, expiresAt);
  const ratioLeft = clamp01(daysLeft / totalDays);
  return { daysLeft, ratioLeft };
}

export default function GestionPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("banners");
  const [now, setNow] = useState<Date>(() => new Date());
  const [token, setToken] = useState<string | null>(null);
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [wholesalers, setWholesalers] = useState<WholesalerRow[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (!existing) {
      router.replace("/");
      return;
    }

    let cancelled = false;

    (async () => {
      setIsAuthLoading(true);
      setAuthError(null);
      const { data, error } = await supabase
        .from("admin_tokens")
        .select("id")
        .eq("token_value", existing)
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        setAuthError("No se pudo validar el token.");
        setIsAuthLoading(false);
        return;
      }
      if (!data) {
        sessionStorage.removeItem(SESSION_KEY);
        router.replace("/");
        return;
      }

      setToken(existing);
      setIsAuthLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 10_000);
    return () => window.clearInterval(id);
  }, []);

  const fetchBanners = useCallback(async () => {
    const { data, error } = await supabase
      .from("banners")
      .select("id,image_url,redirect_url,is_active,created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) return;
    setBanners((data ?? []) as BannerRow[]);
  }, []);

  const fetchWholesalers = useCallback(async () => {
    const { data, error } = await supabase
      .from("wholesalers")
      .select(
        "id,email,company_name,is_verified,access_granted_at,access_expires_at,created_at",
      )
      .order("created_at", { ascending: false });

    if (error) return;
    setWholesalers((data ?? []) as WholesalerRow[]);
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      await Promise.all([fetchBanners(), fetchWholesalers()]);
    })();
  }, [fetchBanners, fetchWholesalers, token]);

  useEffect(() => {
    if (!token) return;

    const bannersChannel = supabase
      .channel("admin-banners")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "banners" },
        () => fetchBanners(),
      )
      .subscribe();

    const wholesalersChannel = supabase
      .channel("admin-wholesalers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wholesalers" },
        () => fetchWholesalers(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bannersChannel);
      supabase.removeChannel(wholesalersChannel);
    };
  }, [fetchBanners, fetchWholesalers, token]);

  const tokenPreview = useMemo(() => {
    if (!token) return "";
    return token.length <= 6 ? token : `${token.slice(0, 3)}…${token.slice(-3)}`;
  }, [token]);

  function onLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    router.replace("/");
  }

  return (
    <div className="flex flex-1 flex-col bg-paper">
      <header className="sticky top-0 z-10 border-b border-black/10 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold tracking-wide text-black/60">
              PANEL
            </div>
            <div className="mt-1 flex items-center gap-2">
              <h1 className="text-lg font-semibold text-black">Gestión</h1>
              <span className="rounded-full border border-black/10 bg-black/5 px-2 py-0.5 text-xs text-black/70">
                token {tokenPreview}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold text-black hover:bg-black/5"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-6 py-6">
        {isAuthLoading ? (
          <div className="rounded-2xl border border-black/10 bg-white px-6 py-6 text-sm text-black/70 shadow-card">
            Validando token...
          </div>
        ) : authError ? (
          <div className="rounded-2xl border border-black/10 bg-white px-6 py-6 text-sm text-primary-bright shadow-card">
            {authError}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-black/10 bg-white p-1">
            <button
              type="button"
              onClick={() => setTab("banners")}
              className={[
                "rounded-lg px-3 py-2 text-sm font-semibold",
                tab === "banners"
                  ? "bg-primary text-white"
                  : "text-black/70 hover:bg-black/5",
              ].join(" ")}
            >
              Banners
            </button>
            <button
              type="button"
              onClick={() => setTab("mayoristas")}
              className={[
                "rounded-lg px-3 py-2 text-sm font-semibold",
                tab === "mayoristas"
                  ? "bg-primary text-white"
                  : "text-black/70 hover:bg-black/5",
              ].join(" ")}
            >
              Mayoristas
            </button>
          </div>

          <div className="text-xs text-black/60">Supabase conectado</div>
        </div>

        {tab === "banners" ? (
          <BannersPanel banners={banners} />
        ) : (
          <WholesalersPanel now={now} wholesalers={wholesalers} />
        )}
      </div>
    </div>
  );
}

function fileExtFromType(contentType: string | undefined): string {
  const t = (contentType ?? "").toLowerCase();
  if (t.includes("png")) return "png";
  if (t.includes("webp")) return "webp";
  if (t.includes("gif")) return "gif";
  if (t.includes("jpeg") || t.includes("jpg")) return "jpg";
  return "bin";
}

function safeNamePart(value: string): string {
  return value.replace(/[^a-z0-9\-_]+/gi, "-").slice(0, 60);
}

async function fileFromUrl(url: string): Promise<File> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error("fetch_failed");
  const blob = await res.blob();
  const ext = fileExtFromType(blob.type);
  const name = `banner-${safeNamePart(new URL(url).hostname)}.${ext}`;
  return new File([blob], name, { type: blob.type || "application/octet-stream" });
}

function BannersPanel({ banners }: { banners: BannerRow[] }) {
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [touched, setTouched] = useState(false);
  const fileObjectUrlRef = useRef<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (fileObjectUrlRef.current) URL.revokeObjectURL(fileObjectUrlRef.current);
    };
  }, []);

  const valid = linkUrl.trim().length > 0 && (file !== null || imageUrl.trim().length > 0);
  const showError = touched && !valid;

  function onPickFile(file: File | null) {
    setSubmitError(null);
    setFile(file);
    if (!file) {
      setImageUrl("");
      if (fileObjectUrlRef.current) {
        URL.revokeObjectURL(fileObjectUrlRef.current);
        fileObjectUrlRef.current = null;
      }
      return;
    }
    if (fileObjectUrlRef.current) URL.revokeObjectURL(fileObjectUrlRef.current);
    const url = URL.createObjectURL(file);
    fileObjectUrlRef.current = url;
    setImageUrl(url);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setSubmitError(null);
    if (!valid) return;
    setIsSubmitting(true);
    try {
      const inputUrl = imageUrl.trim();
      const uploadFile = file ?? (inputUrl ? await fileFromUrl(inputUrl) : null);
      if (!uploadFile) {
        setSubmitError("Selecciona un archivo o ingresa una URL válida.");
        return;
      }

      const ext = fileExtFromType(uploadFile.type);
      const path = `banners/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const upload = await supabase.storage.from("banners").upload(path, uploadFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: uploadFile.type || undefined,
      });

      if (upload.error) {
        setSubmitError("No se pudo subir la imagen al bucket banners.");
        return;
      }

      const publicUrl = supabase.storage.from("banners").getPublicUrl(path).data.publicUrl;
      const insert = await supabase.from("banners").insert({
        image_url: publicUrl,
        redirect_url: linkUrl.trim(),
      });

      if (insert.error) {
        setSubmitError("No se pudo insertar el banner en la tabla banners.");
        return;
      }

      setLinkUrl("");
      setImageUrl("");
      setFile(null);
      setTouched(false);
      if (fileObjectUrlRef.current) {
        URL.revokeObjectURL(fileObjectUrlRef.current);
        fileObjectUrlRef.current = null;
      }
    } catch {
      setSubmitError("No se pudo procesar la imagen.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <section className="rounded-2xl border border-black/10 bg-white shadow-card">
        <div className="border-b border-black/10 px-6 py-5">
          <h2 className="text-sm font-semibold text-black">Sección de Banners</h2>
          <p className="mt-1 text-xs text-black/60">
            Añade banners y simula el carrusel con estado global.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-6 py-6">
          <div>
            <label className="block text-sm font-medium text-black">
              URL del vínculo
            </label>
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="https://..."
              className={[
                "mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none",
                "border-black/15 focus:border-primary focus:ring-4 focus:ring-accent-soft/40",
                showError && linkUrl.trim().length === 0 ? "border-primary-bright" : "",
              ].join(" ")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black">
              Imagen (archivo o URL)
            </label>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm text-black file:mr-3 file:rounded-lg file:border-0 file:bg-black/5 file:px-3 file:py-1.5 file:text-sm file:font-semibold hover:bg-black/[0.02]"
              />
              <input
                value={imageUrl}
                onChange={(e) => {
                  setSubmitError(null);
                  setImageUrl(e.target.value);
                  setFile(null);
                }}
                onBlur={() => setTouched(true)}
                placeholder="https://... o selecciona archivo"
                className={[
                  "w-full rounded-xl border px-3 py-2 text-sm outline-none",
                  "border-black/15 focus:border-primary focus:ring-4 focus:ring-accent-soft/40",
                  showError && imageUrl.trim().length === 0 ? "border-primary-bright" : "",
                ].join(" ")}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!valid}
            className={[
              "w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white",
              "bg-primary hover:bg-primary-bright active:bg-primary",
              "focus:outline-none focus:ring-4 focus:ring-accent-soft/50",
              !valid ? "cursor-not-allowed opacity-60" : "",
            ].join(" ")}
          >
            {isSubmitting ? "Subiendo..." : "Añadir"}
          </button>

          <div className="text-xs text-black/60">
            {submitError
              ? submitError
              : showError
                ? "Completa vínculo e imagen."
                : "Sube a Storage (banners) e inserta en tabla banners."}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white shadow-card">
        <div className="flex items-start justify-between gap-4 border-b border-black/10 px-6 py-5">
          <div>
            <h2 className="text-sm font-semibold text-black">Carrusel</h2>
            <p className="mt-1 text-xs text-black/60">
              {banners.length === 0
                ? "Aún no hay banners."
                : `${banners.length} banner(s) activos.`}
            </p>
          </div>
          <div className="rounded-full bg-black/5 px-2 py-1 text-xs text-black/70">
            Realtime
          </div>
        </div>

        <div className="px-6 py-6">
          {banners.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/20 bg-black/[0.02] px-4 py-10 text-center text-sm text-black/60">
              Añade un banner para ver la previsualización.
            </div>
          ) : (
            <div className="space-y-3">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-4 rounded-xl border border-black/10 bg-white px-3 py-3"
                >
                  <div className="h-14 w-24 overflow-hidden rounded-lg border border-black/10 bg-black/[0.02]">
                    <Image
                      src={b.image_url}
                      alt="Banner"
                      width={96}
                      height={56}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-black">
                      {b.redirect_url ?? "—"}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-black/60">
                      <span className="rounded-full bg-black/5 px-2 py-0.5">
                        {new Date(b.created_at).toLocaleString()}
                      </span>
                      <span className="rounded-full bg-accent-soft/30 px-2 py-0.5 text-black/70">
                        En carrusel
                      </span>
                    </div>
                  </div>
                  {b.redirect_url ? (
                    <a
                      href={b.redirect_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-black hover:bg-black/5"
                    >
                      Abrir
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

async function grantAccessDbNow(wholesalerId: string): Promise<{
  ok: boolean;
  errorMessage: string | null;
}> {
  const res = await supabase.rpc("grant_wholesaler_access", {
    wholesaler_id: wholesalerId,
  });

  if (!res.error) return { ok: true, errorMessage: null };

  const msg = res.error.message ?? "Error actualizando acceso.";
  if (msg.toLowerCase().includes("grant_wholesaler_access")) {
    const grantedAt = new Date();
    const expiresAt = new Date(grantedAt);
    expiresAt.setDate(expiresAt.getDate() + 30);
    const fallback = await supabase
      .from("wholesalers")
      .update({
        access_granted_at: grantedAt.toISOString(),
        access_expires_at: expiresAt.toISOString(),
      })
      .eq("id", wholesalerId);

    if (!fallback.error) return { ok: true, errorMessage: null };
    return { ok: false, errorMessage: fallback.error.message ?? msg };
  }

  return { ok: false, errorMessage: msg };
}

function WholesalersPanel({ now, wholesalers }: { now: Date; wholesalers: WholesalerRow[] }) {
  const [actionError, setActionError] = useState<string | null>(null);

  return (
    <section className="rounded-2xl border border-black/10 bg-white shadow-card">
      <div className="border-b border-black/10 px-6 py-5">
        <h2 className="text-sm font-semibold text-black">Lista de Mayoristas</h2>
        <p className="mt-1 text-xs text-black/60">
          Dar acceso actualiza access_granted_at / access_expires_at. Verificación actualiza is_verified.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-xs font-semibold text-black/60">
              <th className="border-b border-black/10 px-6 py-3">Usuario</th>
              <th className="border-b border-black/10 px-6 py-3">Mail</th>
              <th className="border-b border-black/10 px-6 py-3">Contraseña</th>
              <th className="border-b border-black/10 px-6 py-3">Acceso</th>
              <th className="border-b border-black/10 px-6 py-3">Verificación</th>
            </tr>
          </thead>
          <tbody>
            {wholesalers.map((w) => {
              const expiresAt = w.access_expires_at ? new Date(w.access_expires_at) : null;
              const access = expiresAt ? accessProgress(now, expiresAt) : null;
              const isActive = expiresAt ? expiresAt.getTime() > now.getTime() : false;
              const user = w.company_name?.trim() ? w.company_name : w.id;

              return (
                <tr key={w.id} className="text-sm text-black">
                  <td className="border-b border-black/10 px-6 py-4">
                    <div className="font-semibold">{user}</div>
                    <div className="mt-1 text-xs text-black/60">id {w.id}</div>
                  </td>
                  <td className="border-b border-black/10 px-6 py-4">
                    {w.email}
                  </td>
                  <td className="border-b border-black/10 px-6 py-4 font-mono text-xs text-black/70">
                    —
                  </td>
                  <td className="border-b border-black/10 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          setActionError(null);
                          const res = await grantAccessDbNow(w.id);
                          if (!res.ok) setActionError(res.errorMessage);
                        }}
                        className={[
                          "rounded-xl px-3 py-2 text-xs font-semibold text-white",
                          "bg-primary hover:bg-primary-bright active:bg-primary",
                        ].join(" ")}
                      >
                        Dar acceso
                      </button>

                      {expiresAt ? (
                        <div className="min-w-[220px]">
                          <div className="flex items-center justify-between text-xs text-black/60">
                            <span className={isActive ? "" : "text-primary-bright"}>
                              {isActive
                                ? `Restan ${access?.daysLeft ?? 0} día(s)`
                                : "Vencido"}
                            </span>
                            <span className="font-mono">
                              {expiresAt.toLocaleDateString()}
                            </span>
                          </div>
                          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/10">
                            <div
                              className={[
                                "h-full rounded-full",
                                isActive ? "bg-accent" : "bg-primary-bright",
                              ].join(" ")}
                              style={{
                                width: `${Math.round(((access?.ratioLeft ?? 0) * 100) * 10) / 10}%`,
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-black/60">
                          Sin acceso asignado
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="border-b border-black/10 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          setActionError(null);
                          const next = !w.is_verified;
                          const res = await supabase
                            .from("wholesalers")
                            .update({ is_verified: next })
                            .eq("id", w.id);
                          if (res.error) setActionError(res.error.message ?? "Error actualizando verificación.");
                        }}
                        className={[
                          "relative inline-flex h-7 w-12 items-center rounded-full border",
                          w.is_verified
                            ? "border-[#1d4ed8] bg-[#1d4ed8]/15"
                            : "border-black/15 bg-black/5",
                        ].join(" ")}
                        aria-pressed={w.is_verified}
                        aria-label="Cambiar verificación"
                      >
                        <span
                          className={[
                            "inline-block h-5 w-5 rounded-full transition-transform",
                            w.is_verified
                              ? "translate-x-6 bg-[#1d4ed8]"
                              : "translate-x-1 bg-white",
                          ].join(" ")}
                        />
                      </button>

                      <span
                        className={[
                          "inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold",
                          w.is_verified
                            ? "bg-[#1d4ed8]/10 text-[#1d4ed8]"
                            : "bg-black/5 text-black/60",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex h-5 w-5 items-center justify-center rounded-full",
                            w.is_verified
                              ? "bg-[#1d4ed8] text-white"
                              : "bg-black/10 text-black/60",
                          ].join(" ")}
                        >
                          ✓
                        </span>
                        {w.is_verified ? "Verificado" : "No verificado"}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 text-xs text-black/60">
        {actionError ? (
          <div className="font-semibold text-primary-bright">{actionError}</div>
        ) : (
          "Suscripción a cambios vía Realtime (si está habilitado en Supabase)."
        )}
      </div>
    </section>
  );
}
