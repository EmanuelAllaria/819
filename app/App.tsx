import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/lib/auth";
import { BuyerSessionProvider } from "./src/lib/buyer/session";
import { RoleProvider } from "./src/lib/role";
import { AppNavigator } from "./src/navigation/App";

export default function App() {
  return (
    <SafeAreaProvider>
      <RoleProvider>
        <BuyerSessionProvider>
          <AuthProvider>
            <NavigationContainer>
              <AppNavigator />
              <StatusBar style="dark" />
            </NavigationContainer>
          </AuthProvider>
        </BuyerSessionProvider>
      </RoleProvider>
    </SafeAreaProvider>
  );
}
