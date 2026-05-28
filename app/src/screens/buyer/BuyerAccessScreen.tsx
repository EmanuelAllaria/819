"use client";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../../components/Card";
import { LogoMark } from "../../components/LogoMark";
import { useAuth } from "../../lib/auth";
import { useBuyerSession } from "../../lib/buyer/session";
import { supabase } from "../../lib/supabase";
import type { BuyerStackParamList } from "../../navigation/buyer/types";
import { Colors } from "../../theme/colors";
import { Radius } from "../../theme/radius";
import { Spacing } from "../../theme/spacing";

WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<BuyerStackParamList, "BuyerAccess">;

type Provider = "google" | "facebook" | "twitter";

const EXPO_AUTH_PROXY_PROJECT_FULL_NAME = "@emanuelallaria/app_2";

export function BuyerAccessScreen({ navigation }: Props) {
  const { user, isLoading: authLoading } = useAuth();
  const { mode, isLoading: modeLoading, setMode } = useBuyerSession();
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<Provider | "guest" | null>(null);

  useEffect(() => {
    if (modeLoading || authLoading) return;
    if (mode === "guest") {
      navigation.replace("BuyerTabs");
      return;
    }
    if (mode === "oauth" && user) {
      navigation.replace("BuyerTabs");
      return;
    }
  }, [authLoading, mode, modeLoading, navigation, user]);

  async function ensureBuyerRow() {
    const u = (await supabase.auth.getUser()).data.user;
    if (!u) return;
    const email = u.email ?? "";
    if (!email) return;
    await supabase.from("buyers").upsert({ id: u.id, email });
  }

  async function onGuest() {
    setErrorText(null);
    setIsSubmitting("guest");
    try {
      await setMode("guest");
      navigation.replace("BuyerTabs");
    } finally {
      setIsSubmitting(null);
    }
  }

  async function onOAuth(provider: Provider) {
    setErrorText(null);
    setIsSubmitting(provider);
    try {
      const isExpoGo = Constants.appOwnership === "expo";
      const returnUrl = isExpoGo ? AuthSession.getDefaultReturnUrl("auth/callback") : null;
      const proxyRedirectTo = isExpoGo ? `https://auth.expo.io/${EXPO_AUTH_PROXY_PROJECT_FULL_NAME}` : null;

      const redirectTo = isExpoGo ? proxyRedirectTo! : Linking.createURL("auth/callback", { scheme: "isiplaza" });
      console.log("[oauth] redirectTo", redirectTo);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });
      console.log("[oauth] authUrl", data?.url);
      if (error || !data?.url) {
        setErrorText(error?.message ?? "No se pudo iniciar OAuth.");
        return;
      }

      const startUrl = isExpoGo
        ? `${proxyRedirectTo!}/start?${new URLSearchParams({
            authUrl: data.url,
            returnUrl: returnUrl!,
          }).toString()}`
        : data.url;

      const result = await WebBrowser.openAuthSessionAsync(startUrl, isExpoGo ? returnUrl! : redirectTo);
      console.log("[oauth] result", result.type, "url" in result ? result.url : null);
      if (result.type !== "success" || !result.url) {
        setErrorText("Autenticación cancelada.");
        return;
      }

      const parsed = Linking.parse(result.url);
      const qp = parsed.queryParams ?? {};
      let code = typeof qp.code === "string" ? qp.code : null;
      if (!code && typeof qp.url === "string") {
        try {
          const inner = new URL(qp.url);
          code = inner.searchParams.get("code");
        } catch {
          const innerParsed = Linking.parse(qp.url);
          code = typeof innerParsed.queryParams?.code === "string" ? innerParsed.queryParams.code : null;
        }
      }
      if (!code) {
        setErrorText("No se recibió código de autenticación.");
        return;
      }

      const exchange = await supabase.auth.exchangeCodeForSession(code);
      if (exchange.error) {
        setErrorText(exchange.error.message ?? "No se pudo completar el login.");
        return;
      }

      await setMode("oauth");
      await ensureBuyerRow();
      navigation.replace("BuyerTabs");
    } catch {
      setErrorText("No se pudo completar el login.");
    } finally {
      setIsSubmitting(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.top}>
          <LogoMark size={92} />
          <Text style={styles.brand}>ISI PLAZA</Text>
          <Text style={styles.subtitle}>Acceso Comprador</Text>
        </View>

        <Card>
          <Text style={styles.cardTitle}>Acceder</Text>
          <Text style={styles.cardHelp}>Elige un método para continuar.</Text>

          <View style={styles.buttons}>
            <PrimaryButton
              label="Continuar con Google"
              disabled={isSubmitting !== null}
              onPress={() => void onOAuth("google")}
            />
            <PrimaryButton
              label="Continuar con Facebook"
              disabled={isSubmitting !== null}
              onPress={() => void onOAuth("facebook")}
              variant="secondary"
            />
            <PrimaryButton
              label="Continuar con X"
              disabled={isSubmitting !== null}
              onPress={() => void onOAuth("twitter")}
              variant="secondary"
            />
            <PrimaryButton
              label="Entrar como invitado"
              disabled={isSubmitting !== null}
              onPress={() => void onGuest()}
              variant="ghost"
            />
          </View>

          {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
        </Card>
      </View>
    </SafeAreaView>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
  variant,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const v = variant ?? "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        v === "primary" ? styles.btnPrimary : v === "secondary" ? styles.btnSecondary : styles.btnGhost,
        disabled ? styles.btnDisabled : null,
      ]}
    >
      <Text
        style={[
          styles.btnText,
          v === "primary" ? styles.btnTextPrimary : v === "secondary" ? styles.btnTextSecondary : styles.btnTextGhost,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.app },
  container: { flex: 1, padding: Spacing.xl, gap: Spacing.xl, justifyContent: "center" },
  top: { alignItems: "center", gap: 8, marginBottom: Spacing.lg },
  brand: { fontSize: 22, fontWeight: "900", color: Colors.primary, letterSpacing: 1 },
  subtitle: { fontSize: 13, fontWeight: "800", color: Colors.inkMuted, letterSpacing: 2.2 },
  cardTitle: { fontSize: 13, fontWeight: "900", color: Colors.ink, letterSpacing: 0.5, textTransform: "uppercase" },
  cardHelp: { marginTop: 6, fontSize: 13, fontWeight: "700", color: Colors.inkMuted, lineHeight: 18 },
  buttons: { marginTop: 18, gap: 12 },
  btn: {
    height: 50,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    overflow: "hidden",
  },
  btnPrimary: { backgroundColor: Colors.primary },
  btnSecondary: { backgroundColor: Colors.paper, borderColor: Colors.border },
  btnGhost: { backgroundColor: "rgba(17,24,39,0.04)", borderColor: Colors.border },
  btnDisabled: { opacity: 0.7 },
  btnText: { fontSize: 15, fontWeight: "900" },
  btnTextPrimary: { color: Colors.paper },
  btnTextSecondary: { color: Colors.ink },
  btnTextGhost: { color: Colors.ink },
  error: { marginTop: 14, fontSize: 12, fontWeight: "800", color: Colors.primary, lineHeight: 16 },
});
