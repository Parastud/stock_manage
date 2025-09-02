import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "./axios";

const STORAGE_KEYS = {
  MISSED_ORDERS: 'missedorders',
  MISSED_EXPENSES: 'missedexpenses',
  MISSED_PAYMENTS: 'missedpayments',
  USER_TOKEN: 'userToken'
};

const API_ENDPOINTS = {
  ORDER: '/order',
  EXPENSE: '/expense',
  PAYMENT: '/payment'
};

const safeJsonParse = (jsonString, fallback = []) => {
  try {
    return JSON.parse(jsonString) || fallback;
  } catch (error) {
    console.warn('JSON parsing failed:', error.message);
    return fallback;
  }
};

const syncItems = async (items, endpoint, token, itemType) => {
  if (!items || items.length === 0) return { success: 0, failed: 0 };

  let successCount = 0;
  let failedCount = 0;

  const results = await Promise.allSettled(
    items.map(payload =>
      axiosInstance.post(endpoint, payload, {
        headers: { Authorization: token },
        timeout: 10000
      })
    )
  );

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successCount++;
    } else {
      failedCount++;
      console.error(`Failed to sync ${itemType}:`, {
        index,
        error: result.reason?.response?.data?.message || result.reason?.message,
        payload: items[index]
      });
    }
  });

  return { success: successCount, failed: failedCount };
};

export default async function syncOfflineData() {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    if (!token) {
      throw new Error('No authentication token found');
    }

    const [orders, expenses, payments] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.MISSED_ORDERS),
      AsyncStorage.getItem(STORAGE_KEYS.MISSED_EXPENSES),
      AsyncStorage.getItem(STORAGE_KEYS.MISSED_PAYMENTS)
    ]);

    const parsedOrders = safeJsonParse(orders);
    const parsedExpenses = safeJsonParse(expenses);
    const parsedPayments = safeJsonParse(payments);

    const totalItems = parsedOrders.length + parsedExpenses.length + parsedPayments.length;
    
    if (totalItems === 0) {
      return { 
        success: true, 
        message: 'No offline data to sync',
        results: {
          orders: { success: 0, failed: 0 },
          expenses: { success: 0, failed: 0 },
          payments: { success: 0, failed: 0 },
          total: { success: 0, failed: 0 }
        }
      };
    }

    const [orderResults, expenseResults, paymentResults] = await Promise.all([
      syncItems(parsedOrders, API_ENDPOINTS.ORDER, token, 'order'),
      syncItems(parsedExpenses, API_ENDPOINTS.EXPENSE, token, 'expense'),
      syncItems(parsedPayments, API_ENDPOINTS.PAYMENT, token, 'payment')
    ]);

    const totalSuccess = orderResults.success + expenseResults.success + paymentResults.success;
    const totalFailed = orderResults.failed + expenseResults.failed + paymentResults.failed;

    if (totalSuccess > 0 || totalFailed === 0) {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.MISSED_ORDERS),
        AsyncStorage.removeItem(STORAGE_KEYS.MISSED_EXPENSES),
        AsyncStorage.removeItem(STORAGE_KEYS.MISSED_PAYMENTS)
      ]);
    }

    const results = {
      orders: orderResults,
      expenses: expenseResults,
      payments: paymentResults,
      total: { success: totalSuccess, failed: totalFailed }
    };

    return {
      success: totalFailed === 0,
      results
    };

  } catch (error) {
    console.error('Sync process failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
