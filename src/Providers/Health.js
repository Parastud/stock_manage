import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "../utils/axios";
import oldsync from "../utils/oldsync";

const HealthContext = createContext();

// Hook to use context
export const useHealth = () => useContext(HealthContext);

export const HealthProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);

  const checkConnection = async () => {
    try {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        setIsConnected(false);
        return false
      }

      // If internet exists, check server
      const token = await AsyncStorage.getItem("userToken");
      const res = await axiosInstance.get("/heartbeat", {
        headers: { Authorization: token },
      });

      setIsConnected(res.status === 200);
      oldsync()
      return true
    } catch (error) {
      setIsConnected(false);
      return false
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <HealthContext.Provider value={{ isConnected,checkConnection }}>
      {children}
    </HealthContext.Provider>
  );
};
