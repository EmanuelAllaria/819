"use client";

import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "../../components/Card";
import { FooterBrand } from "../../components/FooterBrand";
import { useAuth } from "../../lib/auth";
import { useBuyerSession } from "../../lib/buyer/session";
import { useRole } from "../../lib/role";
import { supabase } from "../../lib/supabase";
import { Colors } from "../../theme/colors";
import { Radius } from "../../theme/radius";
import { Spacing } from "../../theme/spacing";

export function BuyerProfileScreen() {
  const { user } = useAuth();
  const { clearRole } = useRole();
  const { mode, clear: clearBuyerMode } = useBuyerSession();

  async function logout() {
    const ok = await new Promise<boolean>((resolve) => {
      Alert.alert("Cerrar sesión", "¿Deseas cerrar sesión?", [
        { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
        { text: "Cerrar sesión", style: "destructive", onPress: () => resolve(true) },
      ]);
    });
    if (!ok) return;

    await supabase.auth.signOut();
    await clearBuyerMode();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.subtitle}>Acceso rápido a tu cuenta y configuración.</Text>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Cuenta</Text>
        <View style={{ marginTop: 14, gap: 10 }}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estado</Text>
            <Text style={styles.infoValue}>
              {mode === "guest" ? "Invitado" : user ? "Conectado" : "Sin sesión"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mail</Text>
            <Text style={styles.infoValue}>{user?.email ?? "—"}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Sesión</Text>
        <Text style={[styles.helper, { marginTop: 8 }]}>Cierra sesión aquí.</Text>
        <Pressable
          onPress={() => void logout()}
          style={[styles.btn, styles.btnGhost, mode === "guest" ? styles.btnDanger : null]}
        >
          <Text style={[styles.btnText, mode === "guest" ? styles.btnTextDanger : null]}>
            {mode === "guest" ? "Salir del modo invitado" : "Cerrar sesión"}
          </Text>
        </Pressable>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Rol</Text>
        <Text style={[styles.helper, { marginTop: 8 }]}>Cambia entre Comprador y Mayorista.</Text>
        <Pressable onPress={() => void clearRole()} style={[styles.btn, styles.btnPrimary]}>
          <Text style={[styles.btnText, styles.btnTextPrimary]}>Cambiar de Rol</Text>
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
  sectionTitle: { fontSize: 13, fontWeight: "900", color: Colors.ink, letterSpacing: 0.5, textTransform: "uppercase" },
  helper: { fontSize: 12, fontWeight: "700", color: Colors.inkMuted, lineHeight: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  infoLabel: { fontSize: 12, fontWeight: "900", color: Colors.inkMuted },
  infoValue: { fontSize: 13, fontWeight: "900", color: Colors.ink },
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
  btnText: { fontSize: 15, fontWeight: "900", color: Colors.ink },
  btnTextPrimary: { color: Colors.paper },
  btnTextDanger: { color: Colors.primary },
});
