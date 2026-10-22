import { useColorScheme } from "react-native";

const light = {
  bg: "#ffffff",
  card: "#f4f5f7",
  text: "#111418",
  subtext: "#6b7280",
  border: "#e5e7eb",
  accent: "#0a84ff",
  live: "#e11d48",
  onAccent: "#ffffff",
};

export type Theme = typeof light;

const dark: Theme = {
  bg: "#0b0d10",
  card: "#16191d",
  text: "#f3f4f6",
  subtext: "#9ca3af",
  border: "#262a30",
  accent: "#3b9bff",
  live: "#fb4d6d",
  onAccent: "#ffffff",
};

export function useTheme(): Theme {
  return useColorScheme() === "dark" ? dark : light;
}
