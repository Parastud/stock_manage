import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "./axios";
export default oldsync = async () => {
        const orders = await AsyncStorage.getItem('missedorders');
        await AsyncStorage.removeItem('missedorders');

        if (!orders) return;

        try {
            const parsedOrders = JSON.parse(orders);
            const token = await AsyncStorage.getItem('userToken');
            console.log(parsedOrders)

            for (const payload of parsedOrders) {
                
                await axiosInstance.post('/order', payload, {
                    headers: { Authorization: token },
                });
            }
            
        } catch (error) {
            console.log('Sync failed:', error?.message || error);
        }
    };