import { FontAwesome } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect, useRef } from "react";
import { SafeAreaView } from "react-native";
import NoInternetWrapper from "../../src/Components/NoInternetBanner";
import { useHealth } from "../../src/Providers/Health";
import syncOfflineData from "../../src/utils/syncOfflineData"; // Use the new clean sync

let appSyncExecuted = false; // Global flag

export default function HomeLayout() {
    const { isConnected, checkConnection } = useHealth();
    const syncAttempted = useRef(false);

    useEffect(() => {
        checkConnection();
    }, []);

    useEffect(() => {
        if (isConnected && !syncAttempted.current && !appSyncExecuted) {
            syncAttempted.current = true;
            appSyncExecuted = true;
            
            syncOfflineData()
              .then(result => {
                if (result?.success && result?.results?.total?.success > 0) {
                } else if (result?.message) {
                } else if (result?.error) {
                  console.warn("⚠️ Sync error:", result.error);
                }
              })
              .catch(error => {
                console.error("❌ Sync failed:", error.message);
              });
        }
    }, [isConnected]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#07363C" }}>
            <NoInternetWrapper>
                <Tabs
                    screenOptions={{
                        headerShown: false,
                        tabBarActiveTintColor: 'white',
                        tabBarInactiveTintColor: 'gray',
                        tabBarStyle: {
                            backgroundColor: '#07363C',
                            height: 60,
                        }
                    }}
                >
                    <Tabs.Screen
                        name="index"
                        options={{
                            title: "Home",
                            tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />
                        }}
                    />
                    <Tabs.Screen
                        name="Payment"
                        options={{
                            title: "Payment",
                            tabBarIcon: ({ color }) => <FontAwesome name="money" size={24} color={color} />
                        }}
                    />
                    <Tabs.Screen
                        name="Expenses"
                        options={{
                            title: "Expenses",
                            tabBarIcon: ({ color }) => <FontAwesome name="credit-card" size={24} color={color} />
                        }}
                    />
                    <Tabs.Screen
                        name="History"
                        options={{
                            title: "Order History",
                            tabBarIcon: ({ color }) => <FontAwesome name="history" size={24} color={color} />
                        }}
                    />
                    <Tabs.Screen
                        name="Profile"
                        options={{
                            title: "Profile",
                            tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} />
                        }}
                    />
                    <Tabs.Screen 
                        name="Receipt" 
                        options={{ 
                            href: null, 
                            tabBarStyle: { display: 'none' } 
                        }} 
                    />
                </Tabs>
            </NoInternetWrapper>
        </SafeAreaView>
    );
}
