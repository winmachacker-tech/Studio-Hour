import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet } from "react-native";
import TodayScreen from "../screens/TodayScreen";
import OpenWorkScreen from "../screens/OpenWorkScreen";
import DashboardScreen from "../screens/DashboardScreen";
import IdeasScreen from "../screens/IdeasScreen";
import PlaceholderScreen from "../screens/PlaceholderScreen";
import { colors, fonts } from "../lib/theme";

const Tab = createBottomTabNavigator();

function GuideScreen() {
  return (
    <PlaceholderScreen eyebrow="studio guide" title="What's on your mind?" />
  );
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const glyphs: Record<string, string> = {
    Today: "◉",
    "Open Work": "◫",
    Dashboard: "⊞",
    Ideas: "◇",
    Guide: "✦",
  };
  return (
    <View style={styles.iconWrap}>
      <Text
        style={[
          styles.glyph,
          { color: focused ? colors.teal : colors.lavender },
        ]}
      >
        {glyphs[label] ?? "·"}
      </Text>
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.lavender,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Open Work" component={OpenWorkScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Ideas" component={IdeasScreen} />
      <Tab.Screen name="Guide" component={GuideScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "rgba(12, 7, 20, 0.92)",
    borderTopWidth: 0,
    borderTopColor: "transparent",
    elevation: 0,
    height: 68,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 20,
  },
  glyph: {
    fontSize: 16,
  },
});
