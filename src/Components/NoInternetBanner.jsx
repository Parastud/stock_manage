import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useHealth } from "../Providers/Health";

const BANNER_HEIGHT = 40;

const NoInternetWrapper = ({ children }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { isConnected, hasInternet, isServerReachable } = useHealth();
  
  const [bannerState, setBannerState] = useState({
    show: false,
    message: "",
    color: "#e74c3c"
  });

  useEffect(() => {
    let newState = { show: false, message: "", color: "#e74c3c" };

    if (!hasInternet) {
      newState = {
        show: true,
        message: "⚠️ No Internet Connection",
        color: "#e74c3c"
      };
    } else if (hasInternet && !isServerReachable) {
      newState = {
        show: true,
        message: "🔄 Server Unavailable - Working Offline",
        color: "#f39c12"
      };
    } else if (isConnected) {
      newState = {
        show: true,
        message: "✅ Connected",
        color: "#27ae60"
      };
    }

    setBannerState(newState);

    if (newState.show) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Hide success message after 2 seconds
      if (isConnected && newState.message.includes("Connected")) {
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setBannerState(prev => ({ ...prev, show: false }));
          });
        }, 2000);
      }
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setBannerState(prev => ({ ...prev, show: false }));
      });
    }
  }, [isConnected, hasInternet, isServerReachable, fadeAnim]);

  return (
    <View style={styles.container}>
      {bannerState.show && (
        <Animated.View
          style={[
            styles.banner,
            {
              backgroundColor: bannerState.color,
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.bannerText}>{bannerState.message}</Text>
          {!hasInternet && (
            <View style={styles.offlineIndicator}>
              <View style={styles.offlineDot} />
              <Text style={styles.offlineText}>Offline Mode</Text>
            </View>
          )}
        </Animated.View>
      )}

      <View style={[styles.content, bannerState.show && styles.contentWithBanner]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 5,
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  bannerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
  },
  offlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginRight: 6,
  },
  offlineText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  contentWithBanner: {
    marginTop: BANNER_HEIGHT,
  },
});

export default NoInternetWrapper;
