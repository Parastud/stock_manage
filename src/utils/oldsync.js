import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "./axios";
export default oldsync = async () => {
    const orders = await AsyncStorage.getItem('missedorders');
    await AsyncStorage.removeItem('missedorders');
    const expenses = await AsyncStorage.getItem('missedexpenses');
    await AsyncStorage.removeItem('missedexpenses');
    const payments = await AsyncStorage.getItem('missedpayments');
    await AsyncStorage.removeItem('missedpayments');


    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
        console.log('No auth token found');
        return;
    }

    if (orders) {
        try {
            const parsedOrders = JSON.parse(orders);

            for (const payload of parsedOrders) {
                try {
                    await axiosInstance.post('/order', payload, {
                        headers: { Authorization: token },
                    });
                } catch (error) {
                    console.log('Failed to sync order:', error?.response?.data?.message || error.message);
                }
            }
        } catch (error) {
            console.log('Failed to parse orders:', error?.message || error);
        }
    }

    if (expenses) {
        try {
            const parsedExpenses = JSON.parse(expenses);

            for (const payload of parsedExpenses) {
                try {
                    await axiosInstance.post('/expense', payload, {
                        headers: { Authorization: token },
                    });
                } catch (error) {
                    console.log('Failed to sync expense:', error?.response?.data?.message || error.message);
                }
            }
        } catch (error) {
            console.log('Failed to parse expenses:', error?.message || error);
        }
    }

    if (payments) {
        try {
            const parsedPayments = JSON.parse(payments);
            for (const payload of parsedPayments) {
                try {
                    await axiosInstance.post('/payment', payload, {
                        headers: { Authorization: token },
                    });
                } catch (error) {
                    console.log('Failed to sync payment:', error?.response?.data?.message || error.message);
                }
            }
        } catch (error) {
            console.log('Failed to parse payments:', error?.message || error);
        }
    }

};