import asyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { Text, TouchableOpacity, View } from 'react-native'

export default function Profile() {

    const handleLogout = async() => {
        await asyncStorage.removeItem('userToken')
        router.replace('/Login')
    }

    return (
        <View className="items-center justify-center align-middle h-full bg-[#07363C]">
            <TouchableOpacity onPress={handleLogout} className="bg-indigo-600 py-3 mt-10 rounded-xl w-[50%] self-center">
                <Text className="text-center text-white text-base font-semibold">
                    Logout
                </Text>
            </TouchableOpacity>
        </View>
    )
}