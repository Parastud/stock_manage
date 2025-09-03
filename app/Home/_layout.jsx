import { FontAwesome } from "@expo/vector-icons";
import { Tabs, usePathname /* or useSegments */ } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NoInternetWrapper from "../../src/Components/NoInternetBanner";
import { useHealth } from "../../src/Providers/Health";
import syncOfflineData from "../../src/utils/syncOfflineData";

export default function HomeLayout() {
  const { isConnected, checkConnection } = useHealth();
  const insets = useSafeAreaInsets();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSucceeded, setSyncSucceeded] = useState(false);

  const pathname = usePathname(); 
  const onReceipt = pathname?.toLowerCase().includes("/receipt");

  useEffect(() => {
    checkConnection();
  }, []);

  const handleSync = async () => {
    if (!isConnected || isSyncing || syncSucceeded) return;
    setIsSyncing(true);
    try {
      const result = await syncOfflineData();
      if (result?.success) {
        setSyncSucceeded(true);
      } else {
        setIsSyncing(false);
      }
    } catch {
      setIsSyncing(false);
    }
  };

  const canPress = isConnected && !isSyncing && !syncSucceeded;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#07363C" }}>
      {isConnected && !onReceipt && (
        <Pressable
          onPress={handleSync}
          disabled={!canPress}
          style={{
            position: "absolute",
            top: insets.top + 8,
            left: 12,
            zIndex: 10,
            backgroundColor: canPress ? "#0EA5A6" : "#2C555A",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <FontAwesome
            name={syncSucceeded ? "check" : "cloud-upload"}
            size={16}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            {syncSucceeded ? "Synced" : isSyncing ? "Syncing..." : "Sync"}
          </Text>
        </Pressable>
      )}

      <NoInternetWrapper>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: "white",
            tabBarInactiveTintColor: "gray",
            tabBarStyle: {
              backgroundColor: "#07363C",
              height: 60 + insets.bottom,
              paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color }) => (
                <FontAwesome name="home" size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="Payment"
            options={{
              title: "Payment",
              tabBarIcon: ({ color }) => (
                <FontAwesome name="money" size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="Expenses"
            options={{
              title: "Expenses",
              tabBarIcon: ({ color }) => (
                <FontAwesome name="credit-card" size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="History"
            options={{
              title: "Order History",
              tabBarIcon: ({ color }) => (
                <FontAwesome name="history" size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="Profile"
            options={{
              title: "Profile",
              tabBarIcon: ({ color }) => (
                <FontAwesome name="user" size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="Receipt"
            options={{
              href: null,
              tabBarStyle: { display: "none" },
            }}
          />
        </Tabs>
      </NoInternetWrapper>
    </SafeAreaView>
  );
}
