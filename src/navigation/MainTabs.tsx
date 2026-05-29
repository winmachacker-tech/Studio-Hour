import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet } from "react-native";
import TodayScreen from "../screens/TodayScreen";
import OpenWorkScreen from "../screens/OpenWorkScreen";
import DashboardScreen from "../screens/DashboardScreen";
import IdeasScreen from "../screens/IdeasScreen";
import GuideScreen from "../screens/GuideScreen";
import {
  TodayIcon,
  OpenWorkIcon,
  DashboardIcon,
  IdeasIcon,
  GuideIcon,
} from "../components/icons/TabIcons";
import { colors, fonts } from "../lib/theme";

const Tab = createBottomTabNavigator();

const ICON_SIZE = 22;

const ICONS: Record<string, React.FC<{ color: string; size: number }>> = {
  Today: TodayIcon,
  "Open Work": OpenWorkIcon,
  Dashboard: DashboardIcon,
  Ideas: IdeasIcon,
  Guide: GuideIcon,
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.lavender,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: styles.tabIcon,
        tabBarIcon: ({ color }) => {
          const Icon = ICONS[route.name];
          return Icon ? <Icon color={color} size={ICON_SIZE} /> : null;
        },
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen
        name="Open Work"
        component={OpenWorkScreen}
        options={{ tabBarLabel: "Open Projects" }}
      />
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
    height: 64,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabLabel: {
    fontFamily: fonts.medium,
    fontSize: 9.5,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  tabIcon: {
    marginBottom: -2,
  },
});
