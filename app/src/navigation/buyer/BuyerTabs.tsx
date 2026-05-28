"use client";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { BuyerProfileScreen } from "../../screens/buyer/BuyerProfileScreen";
import { BuyerSavedScreen } from "../../screens/buyer/BuyerSavedScreen";
import { BuyerSearchScreen } from "../../screens/buyer/BuyerSearchScreen";
import { BuyerWholesalersListScreen } from "../../screens/buyer/BuyerWholesalersListScreen";
import type { BuyerTabParamList } from "./types";
import { Colors } from "../../theme/colors";

const Tab = createBottomTabNavigator<BuyerTabParamList>();

export function BuyerTabs() {
  const screenOptions: BottomTabNavigationOptions = {
    headerShown: false,
    tabBarActiveTintColor: Colors.primary,
    tabBarInactiveTintColor: Colors.inkMuted,
    tabBarStyle: {
      backgroundColor: Colors.paper,
      borderTopColor: Colors.border,
      borderTopWidth: 1,
      height: 62,
      paddingTop: 8,
      paddingBottom: 10,
    },
    tabBarLabelStyle: { fontSize: 11, fontWeight: "800" },
  };

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Search"
        component={BuyerSearchScreen}
        options={{
          title: "Buscar",
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="WholesalersList"
        component={BuyerWholesalersListScreen}
        options={{
          title: "Mayoristas",
          tabBarIcon: ({ color, size }) => <Ionicons name="business-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Saved"
        component={BuyerSavedScreen}
        options={{
          title: "Guardados",
          tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={BuyerProfileScreen}
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
