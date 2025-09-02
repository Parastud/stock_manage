import { Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function _layout() {
  return (
    <SafeAreaView style={{flex:1,backgroundColor: "#07363C"}}>
    <Stack screenOptions={{headerShown:false}}/>
    </SafeAreaView>
  )
}