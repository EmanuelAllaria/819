import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { AppInput } from "../components/AppInput";
import { LogoMark } from "../components/LogoMark";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { RootStackParamList } from "../navigation/types";
import { Colors } from "../theme/colors";
import { Spacing } from "../theme/spacing";
import { isEmail, isPasswordValid } from "../utils/validation";

type Props = NativeStackScreenProps<RootStackParamList, "WholesalerAccess">;

export function RegisterScreen({ navigation }: Props) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [mode, setMode] = useState<"signup" | "login" | "recover">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return;
    navigation.replace("Paywall");
  }, [isAuthLoading, navigation, user]);

  const errors = useMemo(() => {
    const out: Record<string, string> = {};
    if (!isEmail(email)) out.email = "Ingresa un mail válido.";
    if (mode === "recover") return out;
    if (mode === "signup" && !name.trim()) out.name = "Ingresa tu nombre.";
    if (!isPasswordValid(password)) out.password = "Contraseña: 6 a 14 caracteres.";
    if (mode === "signup") {
      if (!confirm) out.confirm = "Confirma tu contraseña.";
      if (confirm && password !== confirm) out.confirm = "Las contraseñas no coinciden.";
    }
    return out;
  }, [confirm, email, mode, name, password]);

  const canSubmit = Object.keys(errors).length === 0;

  async function submit() {
    setTouched(true);
    setServerError(null);
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      if (mode === "recover") {
        const res = await supabase.auth.resetPasswordForEmail(email.trim());
        if (res.error) {
          setServerError(res.error.message ?? "No se pudo enviar el email.");
          return;
        }
        setServerError("Listo. Revisa tu correo para recuperar contraseña.");
        return;
      }

      if (mode === "login") {
        const signIn = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signIn.error || !signIn.data.user) {
          setServerError(signIn.error?.message ?? "No se pudo iniciar sesión.");
          return;
        }

        const userId = signIn.data.user.id;
        await supabase.from("wholesaler_profiles").upsert({
          id: userId,
          email: email.trim(),
        });

        await supabase
          .from("wholesaler_profiles")
          .select("nombre,email")
          .eq("id", userId)
          .limit(1)
          .maybeSingle();

        navigation.replace("Paywall");
        return;
      }

      const signUp = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUp.error || !signUp.data.user) {
        setServerError(signUp.error?.message ?? "No se pudo crear la cuenta.");
        return;
      }

      if (!signUp.data.session) {
        const signIn = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signIn.error) {
          setServerError(
            signIn.error.message ??
              "Cuenta creada, pero no se pudo iniciar sesión. Revisa confirmación de email en Supabase.",
          );
          return;
        }
      }

      const userId = signUp.data.user.id;
      const insert = await supabase.from("wholesaler_profiles").upsert({
        id: userId,
        email: email.trim(),
        nombre: name.trim(),
      });

      if (insert.error) {
        setServerError(insert.error.message ?? "No se pudo inicializar el perfil.");
        return;
      }

      navigation.replace("Paywall");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.top}>
          <LogoMark />
          <Text style={styles.title}>
            {mode === "signup" ? "¡Registrate!" : mode === "login" ? "Iniciar sesión" : "Recuperar contraseña"}
          </Text>
          <Text style={styles.subtitle}>
            {mode === "signup"
              ? "Crea usuario para mayoristas."
              : mode === "login"
                ? "Accede con tu mail y contraseña."
                : "Te enviamos un correo para recuperar acceso."}
          </Text>
        </View>

        <View style={styles.form}>
          {mode === "signup" ? (
            <AppInput
              label="Nombre"
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre"
              autoCapitalize="words"
              error={touched ? errors.name : undefined}
            />
          ) : null}
          <AppInput
            label="Mail"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@mail.com"
            keyboardType="email-address"
            error={touched ? errors.email : undefined}
          />
          {mode !== "recover" ? (
            <>
              <AppInput
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="6 a 14 caracteres"
                secureTextEntry
                error={touched ? errors.password : undefined}
              />
              {mode === "signup" ? (
                <AppInput
                  label="Confirmar contraseña"
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Repite tu contraseña"
                  secureTextEntry
                  error={touched ? errors.confirm : undefined}
                />
              ) : null}
            </>
          ) : null}

          {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}
          <AppButton
            label={mode === "signup" ? "Registrarme" : mode === "login" ? "Ingresar" : "Enviar correo"}
            onPress={submit}
            disabled={!canSubmit}
            loading={isSubmitting}
          />
          {mode === "login" ? (
            <Pressable onPress={() => setMode("recover")} hitSlop={10}>
              <Text style={styles.switchMode}>¿Olvidaste tu contraseña?</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => {
              setTouched(false);
              setServerError(null);
              setMode((m) => (m === "signup" ? "login" : "signup"));
            }}
            hitSlop={10}
          >
            <Text style={styles.switchMode}>
              {mode === "signup"
                ? "¿Ya tienes cuenta? Iniciar sesión"
                : "¿No tienes cuenta? Registrate"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.app },
  container: {
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  top: {
    alignItems: "center",
    paddingTop: Spacing.xxl,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.inkMuted,
    fontWeight: "700",
  },
  form: {
    gap: Spacing.lg,
  },
  serverError: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.primaryBright,
    lineHeight: 16,
  },
  switchMode: {
    fontSize: 13,
    fontWeight: "900",
    color: Colors.primary,
    textAlign: "center",
  },
});
