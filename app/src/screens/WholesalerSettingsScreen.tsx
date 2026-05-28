"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppInput } from "../components/AppInput";
import { Card } from "../components/Card";
import { FooterBrand } from "../components/FooterBrand";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { Colors } from "../theme/colors";
import { Radius } from "../theme/radius";
import { Spacing } from "../theme/spacing";

const PROMO_WHATSAPP_URL =
  "https://wa.me/521000000000?text=" +
  encodeURIComponent("Hola, quiero comprar promoción (banners) para ISI PLAZA.");

export function WholesalerSettingsScreen() {
  const { user } = useAuth();
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      const res = await supabase
        .from("wholesaler_profiles")
        .select("acceso,fecha_aprobacion")
        .eq("id", user.id)
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      const enabled = res.data?.acceso ?? false;
      const approvedAt = res.data?.fecha_aprobacion ?? null;
      if (!enabled || !approvedAt) {
        setExpiresAt(null);
        return;
      }
      const exp = new Date(approvedAt);
      exp.setDate(exp.getDate() + 30);
      setExpiresAt(exp.toISOString());
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const errors = useMemo(() => {
    const out: Record<string, string> = {};
    const p = password.trim();
    if (p.length > 0 && (p.length < 6 || p.length > 14)) out.password = "Contraseña: 6 a 14 caracteres.";
    if (p.length > 0 && confirm.trim().length === 0) out.confirm = "Confirma tu contraseña.";
    if (confirm.trim().length > 0 && p !== confirm.trim()) out.confirm = "Las contraseñas no coinciden.";
    return out;
  }, [confirm, password]);

  async function openPromo() {
    try {
      const ok = await Linking.canOpenURL(PROMO_WHATSAPP_URL);
      if (ok) await Linking.openURL(PROMO_WHATSAPP_URL);
    } catch {}
  }

  async function updatePassword() {
    setTouched(true);
    if (!user) return;
    if (Object.keys(errors).length > 0) return;
    if (!password.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await supabase.auth.updateUser({ password: password.trim() });
      if (res.error) {
        Alert.alert("Error", res.error.message ?? "No se pudo cambiar contraseña.");
        return;
      }
      setPassword("");
      setConfirm("");
      setTouched(false);
      Alert.alert("Listo", "Contraseña actualizada.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function logout() {
    const ok = await new Promise<boolean>((resolve) => {
      Alert.alert("Cerrar sesión", "¿Deseas cerrar sesión?", [
        { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
        { text: "Cerrar sesión", style: "destructive", onPress: () => resolve(true) },
      ]);
    });
    if (!ok) return;
    await supabase.auth.signOut();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Ajustes</Text>
        <Text style={styles.subtitle}>
          Tu suscripción acaba el día{" "}
          <Text style={styles.subtitleStrong}>{expiresAt ? new Date(expiresAt).toLocaleDateString() : "—"}</Text>
        </Text>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Promoción</Text>
        <Text style={styles.helper}>Comprar promoción (banners).</Text>
        <Pressable onPress={() => void openPromo()} style={[styles.btn, styles.btnPrimary]}>
          <Text style={[styles.btnText, styles.btnTextPrimary]}>Comprar promoción (banners)</Text>
        </Pressable>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
        <View style={{ marginTop: 14, gap: 14 }}>
          <AppInput
            label="Nueva contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={touched ? errors.password : undefined}
          />
          <AppInput
            label="Repetir contraseña"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            error={touched ? errors.confirm : undefined}
          />
          <Pressable
            onPress={() => void updatePassword()}
            disabled={isSubmitting}
            style={[styles.btn, styles.btnPrimary, isSubmitting ? styles.btnDisabled : null]}
          >
            <Text style={[styles.btnText, styles.btnTextPrimary]}>
              {isSubmitting ? "Guardando..." : "Guardar contraseña"}
            </Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Sesión</Text>
        <Pressable onPress={() => void logout()} style={[styles.btn, styles.btnGhost, styles.btnDanger]}>
          <Text style={[styles.btnText, styles.btnTextDanger]}>Logout</Text>
        </Pressable>
      </Card>

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
  subtitleStrong: { fontWeight: "900", color: Colors.ink },
  sectionTitle: { fontSize: 13, fontWeight: "900", color: Colors.ink, letterSpacing: 0.5, textTransform: "uppercase" },
  helper: { marginTop: 8, fontSize: 12, fontWeight: "700", color: Colors.inkMuted, lineHeight: 16 },
  btn: {
    marginTop: 14,
    height: 50,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    overflow: "hidden",
  },
  btnPrimary: { backgroundColor: Colors.primary },
  btnGhost: { backgroundColor: Colors.paper, borderColor: Colors.border },
  btnDanger: { borderColor: "rgba(211,47,47,0.30)", backgroundColor: "rgba(211,47,47,0.08)" },
  btnDisabled: { opacity: 0.7 },
  btnText: { fontSize: 15, fontWeight: "900", color: Colors.ink },
  btnTextPrimary: { color: Colors.paper },
  btnTextDanger: { color: Colors.primary },
});
