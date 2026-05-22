"use client";

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BuyerAccessScreen } from "../../screens/buyer/BuyerAccessScreen";
import { BuyerWholesalerProfileScreen } from "../../screens/buyer/BuyerWholesalerProfileScreen";
import type { BuyerStackParamList } from "./types";
import { BuyerTabs } from "./BuyerTabs";
import { Colors } from "../../theme/colors";

const Stack = createNativeStackNavigator<BuyerStackParamList>();

export function BuyerNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="BuyerAccess"
      screenOptions={{
        headerStyle: { backgroundColor: Colors.paper },
        headerTintColor: Colors.ink,
        headerTitleStyle: { fontWeight: "900" },
        contentStyle: { backgroundColor: Colors.app },
      }}
    >
      <Stack.Screen name="BuyerAccess" component={BuyerAccessScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BuyerTabs" component={BuyerTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="WholesalerProfile"
        component={BuyerWholesalerProfileScreen}
        options={{ title: "Mayorista" }}
      />
    </Stack.Navigator>
  );
}
