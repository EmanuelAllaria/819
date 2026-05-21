import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../theme/colors";

export function LogoMark({ size = 96 }: { size?: number }) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 3 }]}>
      <Text style={styles.letter}>A</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  letter: {
    color: Colors.paper,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
