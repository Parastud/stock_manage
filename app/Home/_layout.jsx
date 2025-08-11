import { FontAwesome } from "@expo/vector-icons"
import { Tabs } from "expo-router"

export default function HomeLayout() {
    return (
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
                name="Profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} />
                }}
            />
            <Tabs.Screen name="Reciept" options={{ href: null,tabBarStyle: { display: 'none' }
 }} />
        </Tabs>
    )
}
