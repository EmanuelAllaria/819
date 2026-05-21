import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";
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
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={props.onPress}
      disabled={isDisabled}
      activeOpacity={0.92}
      style={[
        styles.base,
        variant === "primary" ? styles.primary : styles.ghost,
        isDisabled ? (variant === "primary" ? styles.primaryDisabled : styles.ghostDisabled) : null,
        props.style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" && !isDisabled ? Colors.paper : Colors.inkMuted} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === "primary" ? styles.labelPrimary : styles.labelGhost,
            isDisabled ? styles.labelDisabled : null,
          ]}
        >
          {props.label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    width: "100%",
    alignSelf: "stretch",
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    overflow: "hidden",
  },
  primary: {
    backgroundColor: Colors.primaryBright,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  primaryDisabled: {
    backgroundColor: "rgba(0,0,0,0.10)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  ghost: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primaryBright,
  },
  ghostDisabled: {
    backgroundColor: "rgba(0,0,0,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  label: {
    fontSize: 16,
    fontWeight: "800",
    includeFontPadding: false,
    textAlignVertical: "center",
    letterSpacing: 0.2,
  },
  labelPrimary: {
    color: Colors.paper,
  },
  labelGhost: {
    color: Colors.primaryBright,
  },
  labelDisabled: {
    color: Colors.inkMuted,
  },
});
