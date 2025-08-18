import { Stack } from "expo-router";
import "../global.css";
import { HealthProvider } from "../src/Components/Providers/Health";

export default function RootLayout() {
  return (
    <HealthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </HealthProvider>
  );
}
