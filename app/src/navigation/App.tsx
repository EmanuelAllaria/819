"use client";

import { StyleSheet, Text, View } from "react-native";
import { RoleSelectionScreen } from "../screens/RoleSelectionScreen";
import { useRole } from "../lib/role";
import { BuyerNavigator } from "./buyer/BuyerNavigator";
import { RootNavigator as WholesalerNavigator } from "./RootNavigator";
import { Colors } from "../theme/colors";
import { Spacing } from "../theme/spacing";

export function AppNavigator() {
  const { role, isLoading } = useRole();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (!role) return <RoleSelectionScreen />;
  if (role === "buyer") return <BuyerNavigator />;
  return <WholesalerNavigator />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.app,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.inkMuted,
  },
});
