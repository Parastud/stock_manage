import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useHealth } from "../Providers/Health";

const NoInternetWrapper = ({children }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const {isConnected} = useHealth()

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isConnected ? 0 : 0, // push down when no internet
      duration: 400,
      useNativeDriver: false, // layout animation → false
    }).start();
  }, [isConnected]);

  return (
    <View style={{ flex: 1 }}>
      {/* Banner */}
      {!isConnected && (
        <View style={styles.banner}>
          <Text style={styles.text}>⚠️ No Internet Connection</Text>
        </View>
      )}

      {/* Screen Content */}
      <Animated.View style={{ flex: 1, marginTop: slideAnim }}>
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    height: 60,
    backgroundColor: "#e74c3c",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    elevation: 5,
  },
  text: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default NoInternetWrapper;
