import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { Colors } from "../theme/colors";
import { Radius } from "../theme/radius";
import { Spacing } from "../theme/spacing";

type Variant = "primary" | "ghost";

export function AppButton(props: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  style?: ViewStyle;
}) {
  const variant = props.variant ?? "primary";
  const disabled = props.disabled ?? false;
  const loading = props.loading ?? false;

  return (
    <Pressable
      onPress={props.onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.ghost,
        (disabled || loading) ? styles.disabled : null,
        pressed && !(disabled || loading) ? styles.pressed : null,
        props.style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? Colors.paper : Colors.ink} />
      ) : (
        <Text style={[styles.label, variant === "primary" ? styles.labelPrimary : styles.labelGhost]}>
          {props.label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  ghost: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    fontSize: 15,
    fontWeight: "800",
  },
  labelPrimary: {
    color: Colors.paper,
  },
  labelGhost: {
    color: Colors.ink,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.55,
  },
});
