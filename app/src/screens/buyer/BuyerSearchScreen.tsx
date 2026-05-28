"use client";

import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { FooterBrand } from "../../components/FooterBrand";
import type { BuyerTabParamList } from "../../navigation/buyer/types";
import { Colors } from "../../theme/colors";
import { Radius } from "../../theme/radius";
import { Spacing } from "../../theme/spacing";

type Category = { code: string; title: string; icon: keyof typeof Ionicons.glyphMap };

const CATEGORIES: Category[] = [
  { code: "Tecnología y Electrónica", title: "Tecnología y Electrónica", icon: "hardware-chip-outline" },
  { code: "Ropa y Moda", title: "Ropa y Moda", icon: "shirt-outline" },
  { code: "Alimentos y Bebidas", title: "Alimentos y Bebidas", icon: "restaurant-outline" },
  { code: "Belleza y Cuidado Personal", title: "Belleza y Cuidado Personal", icon: "sparkles-outline" },
  { code: "Hogar y Muebles", title: "Hogar y Muebles", icon: "home-outline" },
  { code: "Juguetes y Entretenimiento", title: "Juguetes y Entretenimiento", icon: "game-controller-outline" },
  { code: "Deportes y Fitness", title: "Deportes y Fitness", icon: "barbell-outline" },
  { code: "Joyería y Accesorios", title: "Joyería y Accesorios", icon: "diamond-outline" },
  { code: "Salud y Farmacia", title: "Salud y Farmacia", icon: "medkit-outline" },
  { code: "Materiales y Construcción", title: "Materiales y Construcción", icon: "construct-outline" },
];

export function BuyerSearchScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<BuyerTabParamList>>();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscar Mayoristas</Text>
        <Text style={styles.subtitle}>Elige una categoría para ver el listado.</Text>
      </View>

      <FlatList
        data={CATEGORIES}
        keyExtractor={(c) => c.code}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate("WholesalersList", { category: item.code })}
            style={styles.card}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={18} color={Colors.primary} />
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </Pressable>
        )}
        ListFooterComponent={<FooterBrand />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.app },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg, gap: 6 },
  title: { fontSize: 22, fontWeight: "900", color: Colors.ink },
  subtitle: { fontSize: 13, fontWeight: "700", color: Colors.inkMuted, lineHeight: 18 },
  card: {
    flex: 1,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.paper,
    padding: 14,
    gap: 10,
    minHeight: 96,
    justifyContent: "center",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(211,47,47,0.10)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.08)",
  },
  cardTitle: { fontSize: 13, fontWeight: "900", color: Colors.ink, lineHeight: 18 },
});

