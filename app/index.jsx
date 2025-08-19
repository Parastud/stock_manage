import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const userToken = await AsyncStorage.getItem('userToken');
      const loginTimestamp = await AsyncStorage.getItem('loginTimestamp');
      if (!userToken || !loginTimestamp) {
        router.replace('/Login');
        return;
      }

      const now = new Date().getTime();
      const loginTime = parseInt(loginTimestamp);
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (now - loginTime > twentyFourHours) {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('loginTimestamp');
        router.replace('/Login');
      } else {
        router.replace('/Home');
      }
    };

    checkLoginStatus();
  }, []);
}
