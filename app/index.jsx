import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        router.replace('/Login');
      } else {
        router.replace('/Home');
      }
    };

    checkLoginStatus();
  }, []);
}
