import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Colors } from "../theme/colors";
import { RegisterScreen } from "../screens/RegisterScreen";
import { SubscriptionScreen } from "../screens/SubscriptionScreen";
import { OnboardingProfileScreen } from "../screens/OnboardingProfileScreen";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Register"
      screenOptions={{
        headerStyle: { backgroundColor: Colors.paper },
        headerTintColor: Colors.ink,
        headerTitleStyle: { fontWeight: "900" },
        contentStyle: { backgroundColor: Colors.paper },
      }}
    >
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "" }} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: "Suscripción" }} />
      <Stack.Screen name="OnboardingProfile" component={OnboardingProfileScreen} options={{ title: "Dar de Alta" }} />
    </Stack.Navigator>
  );
}
