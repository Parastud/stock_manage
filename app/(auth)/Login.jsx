import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import asyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function App() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter()
  const handleSignin = ()=>{
    if (!username || !password) {
      alert('Please enter both username and password');
      return;
    }

    axios.post(`${process.env.EXPO_PUBLIC_API}/users/login`, { username, password })
      .then(response => {
        asyncStorage.setItem('userToken', response.data.data.token);
        router.replace('/Home');
      })
      .catch(error => {
        alert('Login failed. Please try again.');
      });
  }
  return (
    <SafeAreaView className="flex-1 bg-blue-600 items-center justify-center px-6">
      {/* Logo Icon */}
      <View className="bg-blue-500 rounded-2xl p-6 mb-6">
        <Ionicons name="diamond-outline" size={40} color="#fff" />
      </View>

      <Text className="text-white text-2xl font-bold mb-1">Stock Manage</Text>
      <Text className="text-white text-base mb-6">Welcome Back</Text>

      {/* Username Field */}
      <View className="flex-row items-center bg-white w-full rounded-xl px-4 py-3 mb-4">
        <MaterialIcons name="person-outline" size={20} color="gray" />
        <TextInput
          className="ml-2 flex-1 text-gray-800"
          placeholder="Username"
          placeholderTextColor="gray"
          value={username}
          onChangeText={setUsername}
        />
      </View>

      {/* Password Field */}
      <View className="flex-row items-center bg-white w-full rounded-xl px-4 py-3 mb-6">
        <MaterialIcons name="lock-outline" size={20} color="gray" />
        <TextInput
          className="ml-2 flex-1 text-gray-800"
          placeholder="Password"
          placeholderTextColor="gray"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={20}
            color="gray"
          />
        </TouchableOpacity>
      </View>

      {/* Sign In Button */}
      <TouchableOpacity className="bg-white w-full rounded-xl py-4 mb-6 shadow-md" onPress={handleSignin}>
        <Text className="text-center text-blue-600 font-semibold text-base">Sign In</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}
