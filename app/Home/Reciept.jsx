import * as Linking from 'expo-linking';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import moment from 'moment';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Receipt() {
  const params = useLocalSearchParams();
  const router = useRouter()

  let cart = [];
  let payment = {};
  try {
    cart = typeof params.cart === 'string' ? JSON.parse(params.cart) : params.cart;
  } catch { }
  try {
    payment = typeof params.payment === 'string' ? JSON.parse(params.payment) : params.payment;
  } catch { }

  const generateHtml = () => `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body {
          font-family: 'Arial', sans-serif;
          padding: 24px;
          background-color: #f8f9fa;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: auto;
          background: #fff;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 0 10px rgba(0,0,0,0.05);
        }
        h1 {
          text-align: center;
          color: #4f46e5;
        }
        .section {
          margin-bottom: 16px;
        }
        .section-title {
          font-weight: bold;
          color: #6b7280;
          margin-bottom: 4px;
        }
        .section-value {
          font-size: 16px;
          font-weight: 500;
        }
        .amount {
          font-size: 18px;
          font-weight: bold;
        }
        .green { color: #16a34a; }
        .red { color: #dc2626; }
        .item-list {
          border-top: 1px solid #e5e7eb;
          margin-top: 12px;
          padding-top: 12px;
        }
        .item-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🧾 Receipt</h1>

        <div class="section">
          <div class="section-title">Order ID</div>
          <div class="section-value">${params._id}</div>
        </div>

        <div class="section">
          <div class="section-title">Date</div>
          <div class="section-value">${moment(params.date).format('DD MMM YYYY, hh:mm A')}</div>
        </div>

        <div class="section">
          <div class="section-title">Customer</div>
          <div class="section-value">${params.customername}</div>
        </div>

        <div class="section">
          <div class="section-title">Total Amount</div>
          <div class="section-value amount green">₹${params.totalAmount}</div>
        </div>

        <div class="section">
          <div class="section-title">Pending Amount</div>
          <div class="section-value amount red">₹${params.pending}</div>
        </div>

        <div class="section">
          <div class="section-title">Payment</div>
          <div class="section-value">💵 Cash: ₹${payment.cash ?? 0}</div>
          <div class="section-value">💳 Online: ₹${payment.online ?? 0}</div>
        </div>

        <div class="section item-list">
          <div class="section-title">📦 Items Purchased</div>
          ${cart.map(item => `
            <div class="item-row">
              <span>${item.itemName}</span>
              <span>Qty: ${item.quantity}</span>
              <span>₹${item.amount}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </body>
  </html>
`;


  const printPDF = async () => {
    try {
      const { uri } = await Print.printToFileAsync({ html: generateHtml() });
      await Sharing.shareAsync(uri);
    } catch {
      Alert.alert('Error', 'Could not generate PDF.');
    }
  };

  const shareViaWhatsApp = () => {
    const message = `🧾 Receipt
Order ID: ${params._id}
Date: ${moment(params.date).format('DD MMM YYYY, hh:mm A')}
Customer: ${params.customername}
Total: ₹${params.totalAmount}
Pending: ₹${params.pending}
Payment: Cash ₹${payment.cash ?? 0}, Online ₹${payment.online ?? 0}
Items: ${cart.map(i => `${i.itemName ?? 'Unnamed'} x${i.quantity} - ₹${i.amount}`).join(', ')}`;

    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp not installed');
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <Text className="text-3xl font-bold text-center text-indigo-600 mb-6">
            🧾 Transaction Receipt
          </Text>

          {/* Order Info */}
          <View className="space-y-2 mb-5">
            <View className="flex-row justify-between">
              <Text className="text-gray-500">Order ID:</Text>
              <Text className="font-semibold">{params._id}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500">Date:</Text>
              <Text className="font-medium">
                {moment(params.date).format('DD MMM YYYY, hh:mm A')}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500">Customer:</Text>
              <Text className="font-medium">{params.customername}</Text>
            </View>
          </View>

          {/* Amounts */}
          <View className="mb-5 border-t border-gray-200 pt-4 space-y-1">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Total Amount</Text>
              <Text className="text-green-700 font-semibold">₹{params.totalAmount}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Pending Amount</Text>
              <Text className="text-red-600 font-semibold">₹{params.pending}</Text>
            </View>
          </View>

          {/* Payment Details */}
          <View className="mb-5">
            <Text className="text-gray-500 mb-2 font-medium">💰 Payment Breakdown</Text>
            <View className="flex-row justify-between">
              <Text>💵 Cash:</Text>
              <Text className="font-medium">₹{payment.cash ?? 'N/A'}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text>💳 Online:</Text>
              <Text className="font-medium">₹{payment.online ?? 'N/A'}</Text>
            </View>
          </View>

          {/* Item List */}
          <View className="mb-5">
            <Text className="text-gray-500 mb-2 font-medium">📦 Items Purchased</Text>
            {Array.isArray(cart) && cart.length > 0 ? (
              cart.map((item, idx) => (
                <View key={idx} className="flex-row justify-between border-b py-2">
                  <Text className="text-gray-800">{item.itemName}</Text>
                  <Text className="text-gray-500">x{item.quantity}</Text>
                  <Text className="font-semibold text-gray-700">₹{item.amount}</Text>
                </View>
              ))
            ) : (
              <Text className="text-gray-400">No items found</Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          onPress={printPDF}
          className="bg-indigo-600 py-4 rounded-2xl mb-4 shadow-sm"
        >
          <Text className="text-center text-white text-base font-semibold">
            📄 Download PDF
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={shareViaWhatsApp}
          className="bg-green-500 py-4 rounded-2xl shadow-sm"
        >
          <Text className="text-center text-white text-base font-semibold">
            📲 Share via WhatsApp
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => router.replace('/Home')}
          className="bg-indigo-600 py-3 mt-10 rounded-xl w-[50%] self-center"
        >
          <Text className="text-center text-white text-base font-semibold">
            🧾 Make New Order
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
