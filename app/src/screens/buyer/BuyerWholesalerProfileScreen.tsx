"use client";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "../../components/Card";
import { FooterBrand } from "../../components/FooterBrand";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import type { BuyerStackParamList } from "../../navigation/buyer/types";
import { Colors } from "../../theme/colors";
import { Radius } from "../../theme/radius";
import { Spacing } from "../../theme/spacing";

type Props = NativeStackScreenProps<BuyerStackParamList, "WholesalerProfile">;

type WholesalerRow = {
  id: string;
  nombre: string | null;
  descripcion: string | null;
  foto_perfil_url: string | null;
  pais: string | null;
  estado_provincia: string | null;
  categoria: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  web: string | null;
  verificado: boolean;
};

type CatalogRow = {
  id: string;
  image_url: string;
  display_order: number;
  carousel_slot: number | null;
};

function displayName(w: WholesalerRow): string {
  return w.nombre?.trim() ? w.nombre : "Mayorista";
}

function clamp100(text: string | null | undefined): string {
  const v = (text ?? "").trim();
  if (!v) return "";
  return v.length <= 100 ? v : `${v.slice(0, 100)}…`;
}

function sanitizePhone(raw: string): string {
  return raw.replace(/[^\d+]/g, "");
}

async function openUrl(url: string) {
  try {
    const ok = await Linking.canOpenURL(url);
    if (ok) await Linking.openURL(url);
  } catch {}
}

async function openWhatsApp(value: string) {
  const v = value.trim();
  if (!v) return;
  if (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("whatsapp://") || v.includes("wa.me")) {
    await openUrl(v);
    return;
  }
  const phone = sanitizePhone(v).replace(/^\+/, "");
  if (!phone) return;
  await openUrl(`https://wa.me/${phone}`);
}

async function track(wholesalerId: string, type: "profile" | "whatsapp") {
  try {
    await supabase.from("metrics").insert({
      wholesaler_id: wholesalerId,
      clicks_perfil: type === "profile" ? 1 : 0,
      clicks_whatsapp: type === "whatsapp" ? 1 : 0,
    });
  } catch {}
}

function CatalogCarousel({
  title,
  items,
}: {
  title: string;
  items: CatalogRow[];
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length === 0 ? (
        <View style={styles.catalogEmpty}>
          <Text style={styles.helper}>Sin imágenes</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ gap: 12, paddingHorizontal: 2 }}
          renderItem={({ item }) => (
            <View style={styles.catalogItem}>
              <Image source={{ uri: item.image_url }} style={styles.catalogImage} resizeMode="cover" />
            </View>
          )}
        />
      )}
    </View>
  );
}

export function BuyerWholesalerProfileScreen({ route }: Props) {
  const wholesalerId = route.params?.wholesalerId ?? "";
  const { user } = useAuth();
  const [row, setRow] = useState<WholesalerRow | null>(null);
  const [catalogs, setCatalogs] = useState<CatalogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);

      const w = await supabase
        .from("wholesaler_profiles")
        .select(
          "id,nombre,descripcion,foto_perfil_url,pais,estado_provincia,categoria,whatsapp,instagram,facebook,web,verificado",
        )
        .eq("id", wholesalerId)
        .limit(1)
        .maybeSingle();

      const c = await supabase
        .from("catalogs")
        .select("id,image_url,display_order,carousel_slot")
        .eq("wholesaler_id", wholesalerId)
        .order("carousel_slot", { ascending: true })
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(120);

      let saved: { id: string } | null = null;
      if (user) {
        const s = await supabase
          .from("saved_wholesalers")
          .select("id")
          .eq("buyer_id", user.id)
          .eq("wholesaler_id", wholesalerId)
          .limit(1)
          .maybeSingle();
        saved = s.data ? ({ id: String((s.data as { id: string }).id) } as { id: string }) : null;
      }

      if (cancelled) return;

      setRow((w.data ?? null) as WholesalerRow | null);
      setCatalogs((c.data ?? []) as CatalogRow[]);
      setSavedId(saved?.id ?? null);
      setIsLoading(false);

      if (wholesalerId) await track(wholesalerId, "profile");
    })();

    return () => {
      cancelled = true;
    };
  }, [user, wholesalerId]);

  const topImages = useMemo(() => {
    const imgs = catalogs.slice(0, 10).map((c) => c.image_url);
    if (row?.foto_perfil_url) return [row.foto_perfil_url, ...imgs];
    return imgs;
  }, [catalogs, row?.foto_perfil_url]);

  const grouped = useMemo(() => {
    const map = new Map<number, CatalogRow[]>();
    for (const c of catalogs) {
      const slot = typeof c.carousel_slot === "number" ? c.carousel_slot : 1;
      if (slot < 1 || slot > 5) continue;
      const arr = map.get(slot) ?? [];
      arr.push(c);
      map.set(slot, arr);
    }
    return {
      c1: map.get(1) ?? [],
      c2: map.get(2) ?? [],
      c3: map.get(3) ?? [],
      c4: map.get(4) ?? [],
      c5: map.get(5) ?? [],
    };
  }, [catalogs]);

  async function toggleSave() {
    if (!user) return;
    if (!row) return;
    setSaving(true);
    try {
      if (savedId) {
        await supabase.from("saved_wholesalers").delete().eq("id", savedId);
        setSavedId(null);
        return;
      }
      const ins = await supabase
        .from("saved_wholesalers")
        .insert({ buyer_id: user.id, wholesaler_id: row.id })
        .select("id")
        .maybeSingle();
      if (!ins.error && ins.data) setSavedId(String((ins.data as { id: string }).id));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {isLoading ? (
        <Card>
          <Text style={styles.helper}>Cargando...</Text>
        </Card>
      ) : !row ? (
        <Card>
          <Text style={styles.emptyTitle}>No encontrado</Text>
          <Text style={styles.helper}>Este mayorista no está disponible.</Text>
        </Card>
      ) : (
        <>
          <View style={styles.hero}>
            {topImages.length === 0 ? (
              <View style={styles.heroEmpty}>
                <Ionicons name="images-outline" size={26} color={Colors.inkMuted} />
              </View>
            ) : (
              <FlatList
                data={topImages}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(u, idx) => `${idx}_${u}`}
                contentContainerStyle={{ gap: 12, paddingHorizontal: Spacing.xl }}
                renderItem={({ item }) => (
                  <View style={styles.heroItem}>
                    <Image source={{ uri: item }} style={styles.heroImage} resizeMode="cover" />
                  </View>
                )}
              />
            )}
          </View>

          <View style={{ paddingHorizontal: Spacing.xl, gap: 12 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {displayName(row)}
              </Text>
              <Pressable
                onPress={() => void toggleSave()}
                disabled={!user || saving}
                style={[styles.iconBtn, !user ? styles.iconBtnDisabled : null]}
              >
                <Ionicons
                  name={savedId ? "heart" : "heart-outline"}
                  size={20}
                  color={savedId ? Colors.primary : Colors.inkMuted}
                />
              </Pressable>
              {row.verificado ? (
                <View style={styles.verified}>
                  <Ionicons name="checkmark" size={12} color={Colors.paper} />
                </View>
              ) : null}
            </View>

            <Text style={styles.meta} numberOfLines={1}>
              {(row.pais ?? "—") + (row.estado_provincia ? ` · ${row.estado_provincia}` : "")}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {row.categoria ?? "—"}
            </Text>
            {row.descripcion ? <Text style={styles.desc}>{clamp100(row.descripcion)}</Text> : null}

            <View style={styles.contactRow}>
              <Pressable
                onPress={async () => {
                  if (!row.whatsapp) return;
                  await track(row.id, "whatsapp");
                  await openWhatsApp(row.whatsapp);
                }}
                style={[styles.contactBtn, !row.whatsapp ? styles.contactBtnDisabled : null]}
              >
                <Ionicons name="logo-whatsapp" size={18} color={Colors.paper} />
                <Text style={styles.contactText}>enviar mensaje</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  if (!row.instagram) return;
                  await track(row.id, "profile");
                  await openUrl(row.instagram);
                }}
                style={[styles.contactIconBtn, !row.instagram ? styles.contactIconBtnDisabled : null]}
              >
                <Ionicons name="logo-instagram" size={18} color={row.instagram ? Colors.primary : Colors.inkMuted} />
              </Pressable>
              <Pressable
                onPress={async () => {
                  if (!row.facebook) return;
                  await track(row.id, "profile");
                  await openUrl(row.facebook);
                }}
                style={[styles.contactIconBtn, !row.facebook ? styles.contactIconBtnDisabled : null]}
              >
                <Ionicons name="logo-facebook" size={18} color={row.facebook ? Colors.primary : Colors.inkMuted} />
              </Pressable>
              <Pressable
                onPress={async () => {
                  if (!row.web) return;
                  await track(row.id, "profile");
                  await openUrl(row.web);
                }}
                style={[styles.contactIconBtn, !row.web ? styles.contactIconBtnDisabled : null]}
              >
                <Ionicons name="globe-outline" size={18} color={row.web ? Colors.primary : Colors.inkMuted} />
              </Pressable>
            </View>
          </View>

          <View style={{ paddingHorizontal: Spacing.xl, gap: 16, marginTop: 8 }}>
            <CatalogCarousel title="Catálogo 1" items={grouped.c1} />
            <CatalogCarousel title="Catálogo 2" items={grouped.c2} />
            <CatalogCarousel title="Catálogo 3" items={grouped.c3} />
            <CatalogCarousel title="Catálogo 4" items={grouped.c4} />
            <CatalogCarousel title="Catálogo 5" items={grouped.c5} />
          </View>
        </>
      )}

      <FooterBrand />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.app },
  container: { paddingBottom: Spacing.xxl, gap: Spacing.lg },
  hero: { paddingTop: Spacing.xl },
  heroEmpty: {
    height: 160,
    marginHorizontal: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  heroItem: {
    width: 280,
    height: 160,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.paper,
    overflow: "hidden",
  },
  heroImage: { width: "100%", height: "100%" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { flex: 1, fontSize: 20, fontWeight: "900", color: Colors.ink },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnDisabled: { opacity: 0.55 },
  verified: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  meta: { fontSize: 12, fontWeight: "700", color: Colors.inkMuted },
  desc: { marginTop: 8, fontSize: 13, fontWeight: "700", color: Colors.inkMuted, lineHeight: 18 },
  contactRow: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
  },
  contactBtnDisabled: { opacity: 0.55 },
  contactText: { fontSize: 13, fontWeight: "900", color: Colors.paper },
  contactIconBtn: {
    width: 46,
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  contactIconBtnDisabled: { opacity: 0.55 },
  sectionTitle: { fontSize: 13, fontWeight: "900", color: Colors.ink, letterSpacing: 0.5, textTransform: "uppercase" },
  catalogItem: {
    width: 160,
    height: 110,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.paper,
    overflow: "hidden",
  },
  catalogImage: { width: "100%", height: "100%" },
  catalogEmpty: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.paper,
    padding: 14,
  },
  emptyTitle: { fontSize: 14, fontWeight: "900", color: Colors.ink },
  helper: { marginTop: 6, fontSize: 12, fontWeight: "700", color: Colors.inkMuted, lineHeight: 16 },
});
