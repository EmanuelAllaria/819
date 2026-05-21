import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { RootStackParamList } from "../navigation/types";
import { Colors } from "../theme/colors";
import { Spacing } from "../theme/spacing";

type Props = NativeStackScreenProps<RootStackParamList, "Subscription">;

const WHATSAPP_URL =
  "https://wa.me/521000000000?text=" +
  encodeURIComponent("Hola, quiero suscribirme a la app (mock). ¿Me autorizan el acceso?");

export function SubscriptionScreen({ navigation, route }: Props) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<{
    canContinue: boolean;
    expiresAtIso: string | null;
    message: string;
  }>({ canContinue: false, expiresAtIso: null, message: "Pendiente de verificación" });

  async function onSubscribe() {
    try {
      const ok = await Linking.canOpenURL(WHATSAPP_URL);
      if (ok) await Linking.openURL(WHATSAPP_URL);
    } catch {}
  }

  function onContinue() {
    if (!status.canContinue) return;
    navigation.navigate("OnboardingProfile");
  }

  const who = route.params ? `${route.params.name} · ${route.params.email}` : "Nuevo usuario";

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } finally {
      navigation.reset({ index: 0, routes: [{ name: "Register" }] });
    }
  }

  async function checkStatus() {
    if (!user) return;
    setIsChecking(true);
    try {
      const { data, error } = await supabase
        .from("wholesalers")
        .select("access_expires_at")
        .eq("id", user.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        setStatus({ canContinue: false, expiresAtIso: null, message: "No se pudo verificar estado." });
        return;
      }

      const expiresAt = data?.access_expires_at ?? null;
      if (!expiresAt) {
        setStatus({ canContinue: false, expiresAtIso: null, message: "Aún sin acceso asignado." });
        return;
      }

      const now = new Date();
      const exp = new Date(expiresAt);
      const active = exp.getTime() > now.getTime();

      setStatus({
        canContinue: active,
        expiresAtIso: expiresAt,
        message: active ? "Acceso activo. Puedes continuar." : "Acceso vencido.",
      });
    } finally {
      setIsChecking(false);
    }
  }

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      navigation.replace("Register");
      return;
    }
    checkStatus();
    const id = setInterval(checkStatus, 10_000);
    return () => clearInterval(id);
  }, [isAuthLoading, navigation, user]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View>
        <View style={styles.topRow}>
          <Text style={styles.title}>Suscripción mensual de 69 mxn</Text>
          <Pressable onPress={signOut} hitSlop={10}>
            <Text style={styles.signOut}>Cerrar sesión</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>{who}</Text>
        <Text style={styles.hint}>Estado: {status.message}</Text>
        {status.expiresAtIso ? (
          <Text style={styles.hint}>Vence: {new Date(status.expiresAtIso).toLocaleString()}</Text>
        ) : null}
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Pago (mock)</Text>
        <Text style={styles.cardText}>
          Al tocar “Suscribirme” te redirige a WhatsApp (enlace ficticio) para simular el pago.
        </Text>
        <AppButton label="Suscribirme" onPress={onSubscribe} />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Verificación</Text>
        <Text style={styles.cardText}>
          El acceso queda habilitado cuando el admin asigna access_expires_at y es mayor a la fecha actual.
        </Text>
        <AppButton label="Verificar Estado" onPress={checkStatus} loading={isChecking} />
        <AppButton label="Continuar" onPress={onContinue} disabled={!status.canContinue} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  signOut: {
    fontSize: 12,
    fontWeight: "900",
    color: Colors.primary,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.ink,
    flex: 1,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: Colors.inkMuted,
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: Colors.inkMuted,
  },
  card: {
    gap: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: Colors.ink,
  },
  cardText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.inkMuted,
    lineHeight: 18,
  },
});
