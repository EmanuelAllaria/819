"use client";

import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { LogoMark } from "../components/LogoMark";
import { useRole } from "../lib/role";
import { Colors } from "../theme/colors";
import { Radius } from "../theme/radius";
import { Spacing } from "../theme/spacing";

export function RoleSelectionScreen() {
  const { setRole } = useRole();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.top}>
          <View style={styles.brandRow}>
            <LogoMark size={54} />
            <View style={styles.brandText}>
              <Text style={styles.brandTitle}>ISI PLAZA</Text>
              <Text style={styles.brandSubtitle}>ADMIN STYLE</Text>
            </View>
          </View>

          <Text style={styles.headline}>Selecciona tu rol</Text>
          <Text style={styles.subhead}>
            La elección define tu UI y tus funciones. Puedes cambiar de rol desde el menú de usuario.
          </Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Ingresar</Text>
          <Text style={styles.cardHelp}>Elige una opción para continuar.</Text>

          <View style={styles.buttons}>
            <AppButton label="Ingresar como Comprador" onPress={() => void setRole("buyer")} />
            <AppButton
              label="Ingresar como Mayorista"
              onPress={() => void setRole("wholesaler")}
              variant="ghost"
            />
          </View>
        </Card>

        <View style={styles.footer}>
          <View style={styles.footerInner}>
            <View style={styles.footerMark} />
            <Text style={styles.footerText}>ISI PLAZA</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.app,
  },
  container: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: "space-between",
    gap: Spacing.xl,
  },
  top: {
    paddingTop: 6,
    gap: 10,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandText: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "800",
    color: Colors.inkMuted,
    letterSpacing: 2.6,
  },
  headline: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: "900",
    color: Colors.ink,
    letterSpacing: 0.2,
  },
  subhead: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.inkMuted,
    lineHeight: 18,
  },
  card: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: Colors.ink,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  cardHelp: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.inkMuted,
  },
  buttons: {
    marginTop: 18,
    gap: 12,
  },
  footer: {
    alignItems: "center",
    paddingBottom: 2,
  },
  footerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  footerMark: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "900",
    color: Colors.ink,
    letterSpacing: 1.2,
  },
});

