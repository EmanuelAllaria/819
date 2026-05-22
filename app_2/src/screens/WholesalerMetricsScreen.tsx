"use client";

import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { FooterBrand } from "../components/FooterBrand";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { Colors } from "../theme/colors";
import { Spacing } from "../theme/spacing";

type Metric = { label: string; value: number };

export function WholesalerMetricsScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profileClicks, setProfileClicks] = useState(0);
  const [whatsappClicks, setWhatsappClicks] = useState(0);

  const sinceIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setProfileClicks(0);
        setWhatsappClicks(0);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const profile = await supabase
        .from("metrics")
        .select("id", { count: "exact", head: true })
        .eq("wholesaler_id", user.id)
        .gt("clicks_perfil", 0)
        .gte("created_at", sinceIso);

      const whatsapp = await supabase
        .from("metrics")
        .select("id", { count: "exact", head: true })
        .eq("wholesaler_id", user.id)
        .gt("clicks_whatsapp", 0)
        .gte("created_at", sinceIso);

      if (cancelled) return;
      setProfileClicks(profile.count ?? 0);
      setWhatsappClicks(whatsapp.count ?? 0);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sinceIso, user]);

  const metrics: Metric[] = [
    { label: "Usuarios que han clickeado tu perfil el último mes", value: profileClicks },
    { label: "Usuarios que han clickeado tu whatsapp último mes", value: whatsappClicks },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Métricas</Text>
        <Text style={styles.subtitle}>Últimos 30 días</Text>
      </View>

      {metrics.map((m) => (
        <Card key={m.label} style={{ gap: 10 }}>
          <Text style={styles.metricLabel}>{m.label}</Text>
          <Text style={styles.metricValue}>{isLoading ? "—" : String(m.value)}</Text>
        </Card>
      ))}

      <FooterBrand />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.app },
  container: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  header: { gap: 6 },
  title: { fontSize: 22, fontWeight: "900", color: Colors.ink },
  subtitle: { fontSize: 13, fontWeight: "700", color: Colors.inkMuted },
  metricLabel: { fontSize: 13, fontWeight: "900", color: Colors.ink, lineHeight: 18 },
  metricValue: { fontSize: 40, fontWeight: "900", color: Colors.primary, letterSpacing: 0.5 },
});
