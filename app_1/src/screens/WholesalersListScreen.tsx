"use client";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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

type Props = NativeStackScreenProps<RootStackParamList, "WholesalersList">;

type ProvinceGroup = {
  state: string;
  wholesalers: WholesalerRow[];
};

type CountryGroup = {
  country: string;
  provinces: ProvinceGroup[];
};

type BannerRow = {
  id: string;
  image_url: string;
  redirect_url: string | null;
};

type WholesalerRow = {
  id: string;
  company_name: string | null;
  description: string | null;
  logo_url: string | null;
  country: string | null;
  state_province: string | null;
  category: string | null;
  is_verified: boolean;
  access_expires_at: string | null;
};

const COUNTRIES: { code: string; name: string }[] = [
  { code: "mx", name: "México" },
  { code: "gt", name: "Guatemala" },
  { code: "sv", name: "El Salvador" },
  { code: "hn", name: "Honduras" },
  { code: "ni", name: "Nicaragua" },
  { code: "cr", name: "Costa Rica" },
  { code: "pa", name: "Panamá" },
  { code: "co", name: "Colombia" },
  { code: "ve", name: "Venezuela" },
  { code: "ec", name: "Ecuador" },
  { code: "pe", name: "Perú" },
  { code: "bo", name: "Bolivia" },
  { code: "cl", name: "Chile" },
  { code: "ar", name: "Argentina" },
  { code: "uy", name: "Uruguay" },
];

function byName(a: string, b: string) {
  return a.localeCompare(b, "es", { sensitivity: "base" });
}

function chunkCountryGroups(wholesalers: WholesalerRow[]): CountryGroup[] {
  const byCountry = new Map<string, WholesalerRow[]>();
  for (const w of wholesalers) {
    const country = w.country ?? "—";
    const arr = byCountry.get(country) ?? [];
    arr.push(w);
    byCountry.set(country, arr);
  }

  const countries = [...byCountry.keys()].sort(byName);
  return countries.map((country) => {
    const items = (byCountry.get(country) ?? []).slice();
    items.sort(
      (a, b) =>
        byName(a.state_province ?? "", b.state_province ?? "") ||
        byName(a.company_name ?? "", b.company_name ?? ""),
    );

    const byState = new Map<string, WholesalerRow[]>();
    for (const w of items) {
      const state = w.state_province ?? "—";
      const arr = byState.get(state) ?? [];
      arr.push(w);
      byState.set(state, arr);
    }
    const states = [...byState.keys()].sort(byName);

    return {
      country,
      provinces: states.map((state) => ({
        state,
        wholesalers: (byState.get(state) ?? [])
          .slice()
          .sort((a, b) => byName(a.company_name ?? "", b.company_name ?? "")),
      })),
    };
  });
}

async function openLink(url: string) {
  try {
    const ok = await Linking.canOpenURL(url);
    if (ok) await Linking.openURL(url);
  } catch {}
}

export function WholesalersListScreen({ navigation, route }: Props) {
  const category = route.params?.category ?? "Buscar Mayoristas";
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [wholesalers, setWholesalers] = useState<WholesalerRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const { width, height } = useWindowDimensions();

  const bannerWidth = Math.round(width * 0.7);
  const bannerHeight = Math.round(height * 0.15);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("id,image_url,redirect_url")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (error) return;
      setBanners((data ?? []) as BannerRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setErrorText(null);

    (async () => {
      const nowIso = new Date().toISOString();
      let q = supabase
        .from("wholesalers")
        .select(
          "id,company_name,description,logo_url,country,state_province,category,is_verified,access_expires_at",
        )
        .gt("access_expires_at", nowIso)
        .order("country", { ascending: true })
        .order("state_province", { ascending: true })
        .order("company_name", { ascending: true });

      if (category) q = q.eq("category", category);
      if (selectedCountry) q = q.eq("country", selectedCountry);

      const { data, error } = await q;
      if (cancelled) return;

      if (error) {
        setErrorText("No se pudo cargar mayoristas.");
        setWholesalers([]);
        setIsLoading(false);
        return;
      }

      setWholesalers((data ?? []) as WholesalerRow[]);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [category, selectedCountry]);

  const countryGroups = useMemo(() => chunkCountryGroups(wholesalers), [wholesalers]);

  return (
    <ScrollView className="flex-1 bg-paper" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="px-4 pt-4">
        <Text className="text-base font-extrabold text-ink">{category}</Text>
        <Text className="mt-1 text-xs text-black/60">
          Banners activos + filtro por país + mayoristas con acceso vigente.
        </Text>
      </View>

      <View className="mt-4">
        <FlatList
          data={banners}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          snapToInterval={bannerWidth + 12}
          decelerationRate="fast"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => (item.redirect_url ? openLink(item.redirect_url) : undefined)}
              style={{ width: bannerWidth, height: bannerHeight }}
              className="overflow-hidden rounded-2xl border border-black/10 bg-white"
            >
              <Image
                source={{ uri: item.image_url }}
                style={{ width: bannerWidth, height: bannerHeight }}
                resizeMode="cover"
              />
              <View className="absolute bottom-0 left-0 right-0 bg-black/35 px-3 py-2">
                <Text className="text-xs font-bold text-white" numberOfLines={1}>
                  {item.redirect_url ?? ""}
                </Text>
              </View>
            </Pressable>
          )}
        />
      </View>

      <View className="mt-5 px-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-extrabold text-ink">Filtrar por país</Text>
          <Pressable
            onPress={() => setSelectedCountry(null)}
            className="rounded-full border border-black/10 bg-black/5 px-3 py-1.5"
          >
            <Text className="text-xs font-bold text-black/70">Limpiar</Text>
          </Pressable>
        </View>

        <View className="mt-3 flex-row flex-wrap">
          {COUNTRIES.map((c) => {
            const active = selectedCountry === c.name;
            return (
              <Pressable
                key={c.code}
                onPress={() => setSelectedCountry(active ? null : c.name)}
                style={{ width: "20%", paddingRight: 8, paddingBottom: 8 }}
              >
                <View
                  className={[
                    "rounded-xl border px-2 py-2",
                    active ? "border-primary bg-primary" : "border-black/10 bg-white",
                  ].join(" ")}
                >
                  <Text
                    className={[
                      "text-center text-[11px] font-extrabold",
                      active ? "text-white" : "text-ink",
                    ].join(" ")}
                    numberOfLines={1}
                  >
                    {c.name}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="mt-2 px-4">
        {isLoading ? (
          <View className="mt-6 items-center justify-center rounded-2xl border border-black/10 bg-white px-4 py-10">
            <ActivityIndicator />
            <Text className="mt-3 text-xs text-black/60">Cargando...</Text>
          </View>
        ) : errorText ? (
          <View className="mt-6 rounded-2xl border border-black/10 bg-white px-4 py-6">
            <Text className="text-sm font-bold text-ink">{errorText}</Text>
          </View>
        ) : countryGroups.length === 0 ? (
          <View className="mt-6 rounded-2xl border border-black/10 bg-white px-4 py-6">
            <Text className="text-sm font-bold text-ink">Sin resultados</Text>
            <Text className="mt-2 text-xs text-black/60">
              Prueba otra categoría o limpia el filtro de país.
            </Text>
          </View>
        ) : (
          <View className="gap-6">
            {countryGroups.map((cg) => (
              <View key={cg.country} className="gap-3">
                <View className="flex-row items-end justify-between">
                  <Text className="text-base font-extrabold text-ink">{cg.country}</Text>
                  <Text className="text-xs text-black/60">
                    {cg.provinces.reduce((acc, p) => acc + p.wholesalers.length, 0)} mayoristas
                  </Text>
                </View>

                {cg.provinces.map((pg) => (
                  <View key={`${cg.country}_${pg.state}`} className="gap-3">
                    <Text className="text-sm font-bold text-black/70">{pg.state}</Text>
                    <View className="flex-row flex-wrap justify-between" style={{ rowGap: 12 }}>
                      {pg.wholesalers.map((w) => (
                        <WholesalerCard
                          key={w.id}
                          wholesaler={w}
                          onPress={() => navigation.navigate("WholesalerProfile", { wholesalerId: w.id })}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function WholesalerCard({ wholesaler, onPress }: { wholesaler: WholesalerRow; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ width: "48%" }}
      className="overflow-hidden rounded-2xl border border-black/10 bg-white"
    >
      <Image
        source={{ uri: wholesaler.logo_url ?? "" }}
        style={{ width: "100%", height: 110 }}
        resizeMode="cover"
      />
      <View className="px-3 py-3">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="flex-1 text-sm font-extrabold text-ink" numberOfLines={1}>
            {wholesaler.company_name ?? "—"}
          </Text>
          {wholesaler.is_verified ? (
            <View className="rounded-full bg-[#1d4ed8] px-2 py-0.5">
              <Text className="text-[10px] font-extrabold text-white">✓</Text>
            </View>
          ) : null}
        </View>
        <Text className="mt-2 text-xs text-black/60" numberOfLines={2}>
          {wholesaler.description ?? ""}
        </Text>
      </View>
    </Pressable>
  );
}
