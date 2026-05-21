"use client";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlatList, Pressable, Text, View } from "react-native";
import { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Search">;

const CATEGORIES = [
  "Tecnología y Electrónica",
  "Ropa y Moda",
  "Alimentos y Bebidas",
  "Belleza y Cuidado Personal",
  "Hogar y Muebles",
  "Juguetes y Entretenimiento",
  "Deportes y Fitness",
  "Joyería y Accesorios",
  "Salud y Farmacia",
  "Materiales y Construcción",
] as const;

export function SearchScreen({ navigation }: Props) {
  return (
    <View className="flex-1 bg-paper px-4 py-6">
      <View className="items-center justify-center py-6">
        <Text className="text-xl font-extrabold text-ink">
          Buscar Mayoristas
        </Text>
        <Text className="mt-2 text-sm text-black/60">
          Selecciona una categoría para ver la lista.
        </Text>
      </View>

      <FlatList
        data={[...CATEGORIES]}
        keyExtractor={(item) => item}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate("WholesalersList", { category: item })}
            className="flex-1 rounded-2xl border border-black/10 bg-white px-3 py-4"
          >
            <Text className="text-sm font-bold text-ink">{item}</Text>
            <Text className="mt-2 text-xs text-black/60">Explorar</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
