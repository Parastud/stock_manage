import asyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { Text, TouchableOpacity, View } from 'react-native'

export default function Profile() {

    const handleLogout = async() => {
        await asyncStorage.removeItem('userToken')
        router.replace('/Login')
    }

    return (
        <View className="items-center justify-center align-middle h-full">
            <TouchableOpacity onPress={handleLogout} className="bg-white w-full rounded-xl py-4 mb-3 shadow-md">
                <Text className="self-center font-bold">
                    Logout
                </Text>
            </TouchableOpacity>
        </View>
    )
}