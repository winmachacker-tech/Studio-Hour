import React from "react";
import Svg, { Path, Circle, Line, Rect } from "react-native-svg";

interface IconProps {
  size?: number;
  color: string;
}

export function TodayIcon({ size = 22, color }: IconProps) {
  // Broken circle with hour mark — echoes the app icon
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3a9 9 0 1 1-6.36 2.64"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Circle cx={12} cy={12} r={1.2} fill={color} />
      <Line
        x1={12}
        y1={12}
        x2={12}
        y2={7.5}
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function OpenWorkIcon({ size = 22, color }: IconProps) {
  // Angled brush stroke / unfinished canvas
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={4}
        y={4}
        width={16}
        height={16}
        rx={2.5}
        stroke={color}
        strokeWidth={1.5}
      />
      <Path
        d="M7.5 16.5l3-4.5 2.5 2.5 3.5-5"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function DashboardIcon({ size = 22, color }: IconProps) {
  // Four-room grid — studio overview
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={4}
        y={4}
        width={6.5}
        height={6.5}
        rx={2}
        stroke={color}
        strokeWidth={1.5}
      />
      <Rect
        x={13.5}
        y={4}
        width={6.5}
        height={6.5}
        rx={2}
        stroke={color}
        strokeWidth={1.5}
      />
      <Rect
        x={4}
        y={13.5}
        width={6.5}
        height={6.5}
        rx={2}
        stroke={color}
        strokeWidth={1.5}
      />
      <Rect
        x={13.5}
        y={13.5}
        width={6.5}
        height={6.5}
        rx={2}
        stroke={color}
        strokeWidth={1.5}
      />
    </Svg>
  );
}

export function IdeasIcon({ size = 22, color }: IconProps) {
  // Small seed / spark
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v2M12 19v2M5.64 5.64l1.41 1.41M16.95 16.95l1.41 1.41M3 12h2M19 12h2M5.64 18.36l1.41-1.41M16.95 7.05l1.41-1.41"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      <Circle
        cx={12}
        cy={12}
        r={3.5}
        stroke={color}
        strokeWidth={1.5}
      />
    </Svg>
  );
}

export function GuideIcon({ size = 22, color }: IconProps) {
  // Compass / north star — quiet direction
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={12}
        r={8.5}
        stroke={color}
        strokeWidth={1.4}
      />
      <Path
        d="M14.5 9.5l-5 2 2 5 5-2z"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={1} fill={color} />
    </Svg>
  );
}
