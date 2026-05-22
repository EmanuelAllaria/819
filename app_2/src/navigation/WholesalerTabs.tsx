"use client";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { OnboardingProfileScreen } from "../screens/OnboardingProfileScreen";
import { WholesalerMetricsScreen } from "../screens/WholesalerMetricsScreen";
import { WholesalerSettingsScreen } from "../screens/WholesalerSettingsScreen";
import type { WholesalerTabParamList } from "./types";
import { Colors } from "../theme/colors";

const Tab = createBottomTabNavigator<WholesalerTabParamList>();

export function WholesalerTabs() {
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
        name="Profile"
        component={OnboardingProfileScreen}
        options={{
          title: "Dar de alta",
          tabBarIcon: ({ color, size }) => <Ionicons name="create-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Metrics"
        component={WholesalerMetricsScreen}
        options={{
          title: "Métricas",
          tabBarIcon: ({ color, size }) => <Ionicons name="analytics-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={WholesalerSettingsScreen}
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

