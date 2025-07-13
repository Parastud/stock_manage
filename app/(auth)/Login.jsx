import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import asyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import axiosInstance from '../../src/Components/utils/axios';

export default function App() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setisLoading] = useState(false);
  const [error, setError] = useState(''); // ⬅️ error state
  const router = useRouter();

  const handleSignin = () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setisLoading(true);
    setError('');

    axiosInstance.post("/users/login", { username, password })
      .then(response => {
        asyncStorage.setItem('userToken', response.data.data.token);
        router.replace('/Home');
      })
      .catch(error => {
        const msg = error.response.data.errors[0].message;
        if(msg=="Invalid username or password!"){
          setError(msg);
        }else{
          setError("Some Problem Occured")
        }
      })
      .finally(() => setisLoading(false));
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-600 items-center justify-center px-6">
      {/* Logo */}
      <View className="bg-blue-500 rounded-2xl p-6 mb-6">
        <Ionicons name="diamond-outline" size={40} color="#fff" />
      </View>

      <Text className="text-white text-2xl font-bold mb-1">Stock Manage</Text>
      <Text className="text-white text-base mb-6">Welcome Back</Text>

      {/* Username Input */}
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

      {/* Password Input */}
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
      <TouchableOpacity
        className="bg-white w-full rounded-xl py-4 mb-3 shadow-md"
        onPress={handleSignin}
        disabled={isLoading}
        style={{ opacity: isLoading ? 0.7 : 1 }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#2563eb" />
        ) : (
          <Text className="text-center text-blue-600 font-semibold text-base">Sign In</Text>
        )}
      </TouchableOpacity>

      {/* Error Message */}
      {error ? (
        <Text className="text-red-500 text-sm text-center">{error}</Text>
      ) : null}
    </SafeAreaView>
  );
}
