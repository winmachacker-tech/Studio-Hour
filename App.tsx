import React from "react";
import { View, ActivityIndicator, StyleSheet, StatusBar } from "react-native";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import AuthScreen from "./src/screens/AuthScreen";
import HomeScreen from "./src/screens/HomeScreen";

function AppContent() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color="#119999" size="large" />
      </View>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return <HomeScreen />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    "BricolageGrotesque-Light": require("./assets/fonts/BricolageGrotesque-Light.ttf"),
    "BricolageGrotesque-Regular": require("./assets/fonts/BricolageGrotesque-Regular.ttf"),
    "BricolageGrotesque-Medium": require("./assets/fonts/BricolageGrotesque-Medium.ttf"),
    "BricolageGrotesque-SemiBold": require("./assets/fonts/BricolageGrotesque-SemiBold.ttf"),
    "BricolageGrotesque-Bold": require("./assets/fonts/BricolageGrotesque-Bold.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color="#119999" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#130D1A" />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#130D1A",
    alignItems: "center",
    justifyContent: "center",
  },
});
