import { FontAwesome } from "@expo/vector-icons"
import { Tabs } from "expo-router"
import { useEffect } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import NoInternetWrapper from "../../src/Components/NoInternetBanner"
import { useHealth } from "../../src/Providers/Health"
import oldsync from "../../src/utils/oldsync"

export default function HomeLayout() {
    const { isConnected } = useHealth()

    useEffect(() => {
        if (isConnected) {
            oldsync()
        }

    }, [])

    return (
        <SafeAreaView style={{flex:1, backgroundColor:"#07363C"}}>
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
                <Tabs.Screen name="Reciept" options={{ href: null, tabBarStyle: { display: 'none' } }} />
            </Tabs>
        </NoInternetWrapper>
        </SafeAreaView>
    )
}
