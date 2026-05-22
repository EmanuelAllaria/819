"use client";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "../../components/Card";
import { FooterBrand } from "../../components/FooterBrand";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import type { BuyerStackParamList } from "../../navigation/buyer/types";
import { Colors } from "../../theme/colors";
import { Radius } from "../../theme/radius";
import { Spacing } from "../../theme/spacing";

type Row = {
  id: string;
  created_at: string;
  wholesaler: {
    id: string;
    nombre: string | null;
    descripcion: string | null;
    foto_perfil_url: string | null;
    verificado: boolean;
  } | null;
};

function displayName(name: string | null | undefined): string {
  const v = (name ?? "").trim();
  return v ? v : "Mayorista";
}

export function BuyerSavedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setRows([]);
        return;
      }
      setIsLoading(true);
      const res = await supabase
        .from("saved_wholesalers")
        .select("id,created_at,wholesaler:wholesaler_profiles(id,nombre,descripcion,foto_perfil_url,verificado)")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      setRows((res.data ?? []) as unknown as Row[]);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function remove(savedId: string) {
    if (!user) return;
    await supabase.from("saved_wholesalers").delete().eq("id", savedId);
    setRows((prev) => prev.filter((r) => r.id !== savedId));
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Guardados</Text>
        <Text style={styles.subtitle}>Mayoristas a los que les diste corazón.</Text>
      </View>

      {!user ? (
        <Card>
          <Text style={styles.emptyTitle}>Inicia sesión para ver Guardados</Text>
          <Text style={styles.helper}>El corazón se asocia a tu cuenta.</Text>
          <Pressable onPress={() => navigation.navigate("BuyerAccess")} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Ir a Acceso</Text>
          </Pressable>
        </Card>
      ) : isLoading ? (
        <Card>
          <Text style={styles.helper}>Cargando...</Text>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <Text style={styles.emptyTitle}>No hay guardados</Text>
          <Text style={styles.helper}>Abre un mayorista y toca el corazón.</Text>
        </Card>
      ) : (
        <View style={{ gap: 12 }}>
          {rows.map((r) => {
            const w = r.wholesaler;
            if (!w) return null;
            return (
              <View key={r.id} style={styles.row}>
                <Pressable
                  onPress={() => navigation.navigate("WholesalerProfile", { wholesalerId: w.id })}
                  style={styles.rowMain}
                >
                  <View style={styles.logo}>
                    {w.foto_perfil_url ? (
                      <Image source={{ uri: w.foto_perfil_url }} style={styles.logoFill} resizeMode="cover" />
                    ) : (
                      <Ionicons name="storefront-outline" size={18} color={Colors.inkMuted} />
                    )}
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={styles.name} numberOfLines={1}>
                        {displayName(w.nombre)}
                      </Text>
                      {w.verificado ? (
                        <View style={styles.verified}>
                          <Ionicons name="checkmark" size={12} color={Colors.paper} />
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.desc} numberOfLines={1}>
                      {w.descripcion ?? "—"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.inkMuted} />
                </Pressable>
                <Pressable onPress={() => void remove(r.id)} hitSlop={10} style={styles.removeBtn}>
                  <Ionicons name="trash-outline" size={18} color={Colors.primary} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      <FooterBrand />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.app },
  container: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  header: { gap: 6 },
  title: { fontSize: 22, fontWeight: "900", color: Colors.ink },
  subtitle: { fontSize: 13, fontWeight: "700", color: Colors.inkMuted, lineHeight: 18 },
  emptyTitle: { fontSize: 14, fontWeight: "900", color: Colors.ink },
  helper: { marginTop: 6, fontSize: 12, fontWeight: "700", color: Colors.inkMuted, lineHeight: 16 },
  primaryBtn: {
    marginTop: 14,
    height: 50,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
  },
  primaryBtnText: { fontSize: 15, fontWeight: "900", color: Colors.paper },
  row: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.paper,
    overflow: "hidden",
  },
  rowMain: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  removeBtn: { position: "absolute", right: 12, top: 12 },
  logo: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoFill: { width: "100%", height: "100%" },
  name: { fontSize: 13, fontWeight: "900", color: Colors.ink },
  desc: { fontSize: 12, fontWeight: "700", color: Colors.inkMuted },
  verified: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
