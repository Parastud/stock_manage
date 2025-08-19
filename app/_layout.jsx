import { Stack } from "expo-router";
import "../global.css";
import { HealthProvider } from "../src/Providers/Health";

export default function RootLayout() {
  return (
    <HealthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </HealthProvider>
  );
}
