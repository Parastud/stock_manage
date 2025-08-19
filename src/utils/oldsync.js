import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "./axios";
export default oldsync = async () => {
        const orders = await AsyncStorage.getItem('missedorders');

        if (!orders) return;

        try {
            const parsedOrders = JSON.parse(orders);
            const token = await AsyncStorage.getItem('userToken');

            for (const payload of parsedOrders) {
                console.log("data inserted")
                await axiosInstance.post('/order', payload, {
                    headers: { Authorization: token },
                });
            }
            await AsyncStorage.removeItem('missedorders');
        } catch (error) {
            console.log('Sync failed:', error?.message || error);
        }
    };