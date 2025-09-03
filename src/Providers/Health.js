import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "../utils/axios";

const HealthContext = createContext();

export const useHealth = () => useContext(HealthContext);

export const HealthProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(null);
  const [isServerReachable, setIsServerReachable] = useState(false);

  const checkConnection = async () => {
    try {
      const netInfo = await NetInfo.fetch();
      
      if (!netInfo.isConnected || !netInfo.isInternetReachable) {
        setIsConnected(false);
        setIsServerReachable(false);
        return false;
      }

      try {
        const token = await AsyncStorage.getItem("userToken");
        const res = await axiosInstance.get("/heartbeat", {
          headers: { Authorization: token },
          timeout: 2000
        });

        const serverReachable = res.status === 200;
        setIsConnected(true);
        setIsServerReachable(serverReachable);
        return serverReachable;
      } catch (serverError) {
        setIsConnected(true);
        setIsServerReachable(false);
        return false;
      }
    } catch (error) {
      setIsConnected(false);
      setIsServerReachable(false);
      return false;
    }
  };

  useEffect(() => {
    checkConnection();
    
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected !== isConnected) {
        checkConnection();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <HealthContext.Provider 
      value={{ 
        isConnected: isConnected && isServerReachable, 
        hasInternet: isConnected,
        isServerReachable,
        checkConnection 
      }}
    >
      {children}
    </HealthContext.Provider>
  );
};
