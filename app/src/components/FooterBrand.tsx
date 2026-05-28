"use client";

import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../theme/colors";
import { Spacing } from "../theme/spacing";

export function FooterBrand() {
  return (
    <View style={styles.wrap}>
      <View style={styles.pill}>
        <View style={styles.dot} />
        <Text style={styles.text}>ISI PLAZA</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  pill: {
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
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  text: {
    fontSize: 12,
    fontWeight: "900",
    color: Colors.ink,
    letterSpacing: 1.2,
  },
});

