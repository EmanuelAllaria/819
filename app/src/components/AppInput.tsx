import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Colors } from "../theme/colors";
import { Radius } from "../theme/radius";
import { Spacing } from "../theme/spacing";

export function AppInput(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address";
  secureTextEntry?: boolean;
  error?: string;
  multiline?: boolean;
  maxLength?: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  const [focused, setFocused] = useState(false);
  const inputStyle = useMemo(() => {
    return [
      styles.input,
      props.multiline ? styles.multiline : null,
      focused ? styles.inputFocused : null,
      props.error ? styles.inputError : null,
    ];
  }, [focused, props.error, props.multiline]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={Colors.inkMuted}
        keyboardType={props.keyboardType}
        secureTextEntry={props.secureTextEntry}
        autoCapitalize={props.autoCapitalize ?? "none"}
        autoCorrect={false}
        style={inputStyle}
        multiline={props.multiline}
        maxLength={props.maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {props.error ? <Text style={styles.error}>{props.error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.ink,
  },
  input: {
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.ink,
    backgroundColor: Colors.surface,
  },
  multiline: {
    height: 120,
    paddingVertical: Spacing.md,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: Colors.primaryBright,
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  error: {
    fontSize: 12,
    color: Colors.primaryBright,
    fontWeight: "700",
  },
});
