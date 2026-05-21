"use client";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { RootStackParamList } from "../navigation/types";
import { supabase } from "../lib/supabase";

type Props = NativeStackScreenProps<RootStackParamList, "WholesalerProfile">;

async function openLink(url?: string) {
  if (!url) return;
  try {
    const ok = await Linking.canOpenURL(url);
    if (ok) await Linking.openURL(url);
  } catch {}
}

type WholesalerRow = {
  id: string;
  email: string;
  company_name: string | null;
  description: string | null;
  logo_url: string | null;
  country: string | null;
  state_province: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  website: string | null;
  is_verified: boolean;
};

type CatalogRow = {
  id: string;
  image_url: string;
  display_order: number;
};

async function trackClick(wholesalerId: string, clickType: "profile" | "whatsapp") {
  try {
    await supabase.from("analytics_clicks").insert({
      wholesaler_id: wholesalerId,
      click_type: clickType,
    });
  } catch {}
}

export function WholesalerProfileScreen({ route }: Props) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(220, Math.round(width * 0.62));
  const photoHeight = Math.round(width * 0.62);

  const [wholesaler, setWholesaler] = useState<WholesalerRow | null>(null);
  const [catalog, setCatalog] = useState<CatalogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    trackedRef.current = false;
    setIsLoading(true);
    setErrorText(null);
    setWholesaler(null);
    setCatalog([]);

    (async () => {
      const wholesalerRes = await supabase
        .from("wholesalers")
        .select(
          "id,email,company_name,description,logo_url,country,state_province,whatsapp,instagram,facebook,website,is_verified",
        )
        .eq("id", route.params.wholesalerId)
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (wholesalerRes.error || !wholesalerRes.data) {
        setErrorText("No se pudo cargar el perfil.");
        setIsLoading(false);
        return;
      }

      setWholesaler(wholesalerRes.data as WholesalerRow);

      const catalogRes = await supabase
        .from("catalogs")
        .select("id,image_url,display_order")
        .eq("wholesaler_id", route.params.wholesalerId)
        .order("display_order", { ascending: true })
        .limit(5);

      if (cancelled) return;
      setCatalog((catalogRes.data ?? []) as CatalogRow[]);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [route.params.wholesalerId]);

  useEffect(() => {
    if (!wholesaler) return;
    if (trackedRef.current) return;
    trackedRef.current = true;
    trackClick(wholesaler.id, "profile");
  }, [wholesaler]);

  const photoUrls = useMemo(() => {
    const out: string[] = [];
    if (wholesaler?.logo_url) out.push(wholesaler.logo_url);
    for (const c of catalog) {
      if (out.length >= 5) break;
      out.push(c.image_url);
    }
    return out;
  }, [catalog, wholesaler?.logo_url]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-paper px-4">
        <ActivityIndicator />
        <Text className="mt-3 text-xs text-black/60">Cargando...</Text>
      </View>
    );
  }

  if (errorText) {
    return (
      <View className="flex-1 items-center justify-center bg-paper px-4">
        <Text className="text-base font-extrabold text-ink">{errorText}</Text>
      </View>
    );
  }

  if (!wholesaler) {
    return (
      <View className="flex-1 items-center justify-center bg-paper px-4">
        <Text className="text-base font-extrabold text-ink">No encontrado</Text>
        <Text className="mt-2 text-xs text-black/60">
          El mayorista solicitado no existe.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-paper" contentContainerStyle={{ paddingBottom: 28 }}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {photoUrls.map((u, i) => (
          <Image
            key={`${wholesaler.id}_${i}_${u}`}
            source={{ uri: u }}
            style={{ width, height: photoHeight }}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      <View className="px-4 pt-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-xl font-extrabold text-ink">
              {wholesaler.company_name ?? "—"}
            </Text>
            <Text className="mt-1 text-xs text-black/60">
              {(wholesaler.country ?? "—") + " · " + (wholesaler.state_province ?? "—")}
            </Text>
          </View>

          <View className="items-end gap-2">
            <View
              className={[
                "flex-row items-center gap-2 rounded-full px-3 py-1.5",
                wholesaler.is_verified ? "bg-[#1d4ed8]/10" : "bg-black/5",
              ].join(" ")}
            >
              <View
                className={[
                  "h-6 w-6 items-center justify-center rounded-full",
                  wholesaler.is_verified ? "bg-[#1d4ed8]" : "bg-black/20",
                ].join(" ")}
              >
                <Text className="text-xs font-extrabold text-white">✓</Text>
              </View>
              <Text
                className={[
                  "text-xs font-extrabold",
                  wholesaler.is_verified ? "text-[#1d4ed8]" : "text-black/60",
                ].join(" ")}
              >
                {wholesaler.is_verified ? "Verificado" : "No verificado"}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-4 rounded-2xl border border-black/10 bg-white px-4 py-4">
          <Text className="text-sm font-extrabold text-ink">Descripción</Text>
          <Text className="mt-2 text-sm text-black/70">
            {(wholesaler.description ?? "").slice(0, 100)}
          </Text>
          <Text className="mt-2 text-xs text-black/50">
            {Math.min(100, (wholesaler.description ?? "").length)}/100
          </Text>
        </View>

        <View className="mt-4 rounded-2xl border border-black/10 bg-white px-4 py-4">
          <Text className="text-sm font-extrabold text-ink">Acciones</Text>
          <View className="mt-3 flex-row flex-wrap justify-between" style={{ rowGap: 10 }}>
            <ActionButton
              label="WhatsApp"
              onPress={async () => {
                await trackClick(wholesaler.id, "whatsapp");
                await openLink(wholesaler.whatsapp ?? undefined);
              }}
            />
            <ActionButton label="Instagram" onPress={() => openLink(wholesaler.instagram ?? undefined)} />
            <ActionButton label="Facebook" onPress={() => openLink(wholesaler.facebook ?? undefined)} />
            <ActionButton label="Web" onPress={() => openLink(wholesaler.website ?? undefined)} />
          </View>
        </View>

        <View className="mt-4">
          <Text className="px-1 text-sm font-extrabold text-ink">Catálogo</Text>
          <Text className="mt-1 px-1 text-xs text-black/60">
            Hasta 5 imágenes (Supabase catalogs).
          </Text>

          {catalog.length === 0 ? (
            <View className="mt-3 rounded-2xl border border-black/10 bg-white px-4 py-6">
              <Text className="text-sm font-bold text-ink">Sin catálogo</Text>
              <Text className="mt-2 text-xs text-black/60">Aún no hay productos cargados.</Text>
            </View>
          ) : (
            <View className="mt-3 rounded-2xl border border-black/10 bg-white px-4 py-4">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ columnGap: 12, paddingTop: 4, paddingBottom: 4 }}
              >
                {catalog.map((c) => (
                  <Image
                    key={c.id}
                    source={{ uri: c.image_url }}
                    style={{ width: cardWidth, height: Math.round(cardWidth * 0.7), borderRadius: 16 }}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ width: "48%" }}
      className="rounded-2xl border border-black/10 bg-black/5 px-3 py-3"
    >
      <Text className="text-center text-sm font-extrabold text-ink">{label}</Text>
    </Pressable>
  );
}
