import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'

export default function MainLayout() {
    return (
        <Tabs>
            <Tabs.Screen name='index' options={{
                title: "Home",headerShown:false, tabBarIcon: ({ color, size }) => (
                    <Ionicons name="home" size={size} color={color} />
                ),
            }}
            />
            <Tabs.Screen name='Profile' options={{ href: null }}
            />
        </Tabs>
    )
}