"use client";

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import { SearchScreen } from "../screens/SearchScreen";
import { WholesalersListScreen } from "../screens/WholesalersListScreen";
import { WholesalerProfileScreen } from "../screens/WholesalerProfileScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Search"
      screenOptions={{
        headerStyle: { backgroundColor: "#FFFFFF" },
        headerTintColor: "#000000",
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: "#FFFFFF" },
      }}
    >
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: "Buscar" }}
      />
      <Stack.Screen
        name="WholesalersList"
        component={WholesalersListScreen}
        options={{ title: "Mayoristas" }}
      />
      <Stack.Screen
        name="WholesalerProfile"
        component={WholesalerProfileScreen}
        options={{ title: "Perfil" }}
      />
    </Stack.Navigator>
  );
}
