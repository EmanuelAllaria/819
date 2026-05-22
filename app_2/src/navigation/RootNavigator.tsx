import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Colors } from "../theme/colors";
import { RegisterScreen } from "../screens/RegisterScreen";
import { SubscriptionScreen } from "../screens/SubscriptionScreen";
import { RootStackParamList } from "./types";
import { WholesalerTabs } from "./WholesalerTabs";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="WholesalerAccess"
      screenOptions={{
        headerStyle: { backgroundColor: Colors.paper },
        headerTintColor: Colors.ink,
        headerTitleStyle: { fontWeight: "900" },
        contentStyle: { backgroundColor: Colors.app },
      }}
    >
      <Stack.Screen name="WholesalerAccess" component={RegisterScreen} options={{ title: "" }} />
      <Stack.Screen name="Paywall" component={SubscriptionScreen} options={{ title: "Suscripción" }} />
      <Stack.Screen name="WholesalerTabs" component={WholesalerTabs} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
