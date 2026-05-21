import { PropsWithChildren } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Colors } from "../theme/colors";
import { Radius } from "../theme/radius";
import { Spacing } from "../theme/spacing";

export function Card(props: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.card, props.style]}>{props.children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
});
